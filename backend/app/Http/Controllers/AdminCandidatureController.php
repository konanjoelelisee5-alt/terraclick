<?php

namespace App\Http\Controllers;

use App\Http\Resources\CandidatureResource;
use App\Models\Candidature;
use App\Models\Categorie;
use App\Models\DocumentPrestataire;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\Role;
use App\Models\Secteur;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Équipe TerraClick (permissions candidatures.voir et candidatures.traiter) : vérifie les candidatures, ouvre les pièces jointes,
 * valide — la fiche du prestataire est alors créée et reliée à son compte — ou refuse avec un
 * motif, que le candidat lit pour corriger son dossier.
 */
class AdminCandidatureController extends Controller
{
    /** Pièces du dossier qui deviennent des documents vérifiés de la fiche. */
    private const DOCUMENTS_FICHE = [
        'piece_recto' => 'cni_gerant',
        'rccm' => 'registre_commerce',
        'attestation_fiscale' => 'attestation_fiscale',
        'assurance_decennale' => 'assurance_decennale',
    ];

    /** GET /api/admin/candidatures?statut=en_attente */
    public function index(Request $request): AnonymousResourceCollection
    {
        $statut = $request->validate(['statut' => ['nullable', Rule::in(array_keys(config('candidature.statuts')))]])['statut'] ?? 'en_attente';

        return CandidatureResource::collection(
            Candidature::where('statut', $statut)->with('quartier', 'documents')->oldest('id')->paginate(50)
        );
    }

    /** GET /api/admin/candidatures/{candidature} */
    public function show(Candidature $candidature): CandidatureResource
    {
        return CandidatureResource::make($candidature->load('quartier', 'documents'));
    }

    /** GET /api/admin/candidatures/{candidature}/documents/{type} — une pièce jointe. */
    public function document(Candidature $candidature, string $type): StreamedResponse
    {
        Gate::authorize('voirPieces', $candidature);
        $document = $candidature->documents()->where('type', $type)->firstOrFail();

        return Storage::disk('local')->response($document->fichier, null, ['Content-Type' => $document->mime]);
    }

    /** POST /api/admin/candidatures/{candidature}/valider — crée la fiche et la relie au compte. */
    public function valider(Request $request, Candidature $candidature): CandidatureResource
    {
        Gate::authorize('traiter', $candidature);
        $this->enAttente($candidature);

        DB::transaction(function () use ($request, $candidature) {
            $metiers = collect($candidature->secteurs)->map(fn (string $s) => config("candidature.metiers.{$s}") ?? Secteur::catalogue()[$s]['metier'] ?? null)->filter();
            $categories = collect($candidature->secteurs)->map(fn (string $s) => Secteur::catalogue()[$s]['categories'][0] ?? null)->filter();
            $quartiers = Quartier::whereIn('id', $candidature->quartiers)->pluck('nom');

            $fiche = Prestataire::create([
                'user_id' => $candidature->user_id,
                'quartier_id' => $candidature->quartier_id,
                'nom' => $candidature->nom_activite,
                'metier' => $metiers->implode(' · ') ?: 'Prestataire',
                'description' => $candidature->description,
                'zone_intervention' => $quartiers->implode(', '),
                'telephone' => $candidature->telephone,
                'annee_debut' => $candidature->experience_annees !== null ? now()->year - $candidature->experience_annees : null,
                'actif' => true,
            ]);
            $fiche->categories()->sync(Categorie::whereIn('slug', $categories)->pluck('id'));
            // Ses zones d'intervention : son quartier et ceux qu'il a cités.
            $fiche->zones()->sync(Quartier::whereIn('id', [$candidature->quartier_id, ...$candidature->quartiers])->pluck('id'));

            // Les pièces contrôlées par l'équipe forment le dossier de la fiche, toutes vérifiées.
            foreach ($candidature->documents as $piece) {
                DocumentPrestataire::create([
                    'prestataire_id' => $fiche->id,
                    'type' => self::DOCUMENTS_FICHE[$piece->type] ?? $piece->type,
                    'statut' => 'verifie',
                    'fichier' => $piece->fichier,
                    'mime' => $piece->mime,
                    'verifie_le' => now(),
                    'verifie_par' => $request->user()->id,
                ]);
            }

            // Le compte ouvre désormais l'espace prestataire.
            if ($role = Role::where('cle', 'prestataire')->first()) {
                $candidature->utilisateur->roles()->syncWithoutDetaching([$role->id]);
            }

            $candidature->update([
                'statut' => 'validee',
                'prestataire_id' => $fiche->id,
                'motif_refus' => null,
                'traite_par' => $request->user()->id,
                'traite_le' => now(),
            ]);
        });

        return CandidatureResource::make($candidature->refresh()->load('quartier', 'documents'));
    }

    /** POST /api/admin/candidatures/{candidature}/refuser — demander des compléments : le motif dit au candidat quoi corriger ou ajouter. */
    public function refuser(Request $request, Candidature $candidature): CandidatureResource
    {
        Gate::authorize('traiter', $candidature);
        $this->enAttente($candidature);
        $motif = $request->validate(['motif' => ['required', 'string', 'min:5', 'max:1000']], [
            'motif.required' => 'Dites au candidat ce qu\'il doit corriger.',
        ])['motif'];

        $candidature->update(['statut' => 'refusee', 'motif_refus' => $motif, 'traite_par' => $request->user()->id, 'traite_le' => now()]);

        return CandidatureResource::make($candidature->load('quartier', 'documents'));
    }

    /** POST /api/admin/candidatures/{candidature}/rejeter — refus définitif : le candidat ne peut plus renvoyer de dossier. */
    public function rejeter(Request $request, Candidature $candidature): CandidatureResource
    {
        Gate::authorize('traiter', $candidature);
        $this->enAttente($candidature);
        $motif = $request->validate(['motif' => ['required', 'string', 'min:5', 'max:1000']], [
            'motif.required' => 'Indiquez le motif du rejet.',
        ])['motif'];

        $candidature->update(['statut' => 'rejetee', 'motif_refus' => $motif, 'traite_par' => $request->user()->id, 'traite_le' => now()]);

        return CandidatureResource::make($candidature->load('quartier', 'documents'));
    }

    private function enAttente(Candidature $candidature): void
    {
        if ($candidature->statut !== 'en_attente') {
            throw ValidationException::withMessages(['statut' => 'Cette candidature est déjà traitée.']);
        }
    }
}
