<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeProResource;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Reglage;
use App\Services\CycleDemande;
use App\Support\Montant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Demandes reçues par le technicien connecté : son compte est relié à sa fiche
 * (prestataires.user_id). Il accepte ou refuse, démarre puis marque l'intervention terminée.
 */
class ProDemandeController extends Controller
{
    public function __construct(private CycleDemande $cycle) {}

    /** GET /api/pro/demandes?statut=envoyee,acceptee */
    public function index(Request $request): AnonymousResourceCollection
    {
        $demandes = Demande::query()->whereBelongsTo($this->fiche($request))
            ->with('quartier', 'client')
            ->when($request->query('statut'), fn ($q, $statut) => $q->whereIn('statut', explode(',', (string) $statut)))
            ->latest()->latest('id')->paginate(20);

        return DemandeProResource::collection($demandes);
    }

    /** GET /api/pro/demandes/{demande} */
    public function show(Request $request, Demande $demande): DemandeProResource
    {
        return $this->reponse($this->sienne($request, $demande));
    }

    /** POST /api/pro/demandes/{demande}/accepter — avec un message, une estimation et un créneau facultatifs. */
    public function accepter(Request $request, Demande $demande): DemandeProResource
    {
        $donnees = $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
            'estimation' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'creneau' => ['nullable', 'string', 'max:120'],
        ], [
            'estimation.integer' => 'L\'estimation est un montant en francs CFA.',
        ]);

        $this->verifierGrille($demande, $donnees['estimation'] ?? null);

        return $this->reponse($this->cycle->appliquer(
            $this->sienne($request, $demande), 'accepter', $request->user(), $donnees['message'] ?? null,
            ['estimation' => $donnees['estimation'] ?? null, 'creneau' => $donnees['creneau'] ?? null],
        ));
    }

    /** POST /api/pro/demandes/{demande}/refuser — le motif est demandé, pour informer le client. */
    public function refuser(Request $request, Demande $demande): DemandeProResource
    {
        $motif = $request->validate(['motif' => ['required', 'string', 'min:3', 'max:500']], [
            'motif.required' => 'Indiquez au client pourquoi vous refusez.',
            'motif.min' => 'Le motif est trop court.',
        ])['motif'];

        return $this->reponse($this->cycle->appliquer($this->sienne($request, $demande), 'refuser', $request->user(), $motif));
    }

    /** POST /api/pro/demandes/{demande}/demarrer */
    public function demarrer(Request $request, Demande $demande): DemandeProResource
    {
        return $this->reponse($this->cycle->appliquer($this->sienne($request, $demande), 'demarrer', $request->user()));
    }

    /** POST /api/pro/demandes/{demande}/terminer */
    public function terminer(Request $request, Demande $demande): DemandeProResource
    {
        $message = $request->validate(['message' => ['nullable', 'string', 'max:1000']])['message'] ?? null;

        return $this->reponse($this->cycle->appliquer($this->sienne($request, $demande), 'terminer', $request->user(), $message));
    }

    /** POST /api/pro/demandes/{demande}/etape — commande pressing : étape suivante du suivi. */
    public function etape(Request $request, Demande $demande): DemandeProResource
    {
        return $this->reponse($this->cycle->avancer($this->sienne($request, $demande), $request->user()));
    }

    /** POST /api/pro/demandes/{demande}/signaler — le prestataire déclare un problème (paiement, client absent…). */
    public function signaler(Request $request, Demande $demande): DemandeProResource
    {
        $demande = $this->sienne($request, $demande);
        $donnees = $request->validate([
            'motif' => ['required', Rule::in(array_keys(config('suivi.motifs_prestataire')))],
            'message' => ['required', 'string', 'min:5', 'max:1000'],
            'photos' => ['nullable', 'array', 'max:3'],
            'photos.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
        ], [
            'motif.required' => 'Choisissez ce qui ne va pas.',
            'message.required' => 'Décrivez ce qui s\'est passé : l\'équipe TerraClick le lira.',
        ]);
        $photos = collect($request->file('photos', []))->map(fn ($p) => $p->store("signalements/{$demande->id}", 'public'))->all();
        $demande->signalements()->create([
            ...collect($donnees)->except('photos')->all(),
            'photos' => $photos ?: null,
            'role' => 'prestataire',
            'user_id' => $request->user()->id,
        ]);

        return $this->reponse($demande);
    }

    /**
     * Négociation directe interdite par l'administrateur : l'estimation reste dans la grille des
     * prix indicatifs du secteur (du plus petit minimum au plus grand maximum).
     */
    private function verifierGrille(Demande $demande, ?int $estimation): void
    {
        if ($estimation === null || Reglage::lire('negociation_directe')) {
            return;
        }
        $prix = Prestation::where('secteur', $demande->secteur)->where('actif', true);
        $min = (clone $prix)->min('prix_min');
        $max = (clone $prix)->max('prix_max');
        if (($min !== null && $estimation < $min) || ($max !== null && $estimation > $max)) {
            throw ValidationException::withMessages([
                'estimation' => sprintf('La négociation directe est désactivée : proposez un prix dans la grille TerraClick (%s).', Montant::fourchette($min, $max)),
            ]);
        }
    }

    /** La fiche de technicien reliée au compte ; sans fiche, l'espace pro est fermé. */
    private function fiche(Request $request): Prestataire
    {
        $fiche = Prestataire::where('user_id', $request->user()->id)->first();
        abort_unless($fiche !== null, 403, 'Votre compte n\'est pas relié à une fiche de technicien.');
        abort_if($fiche->statut === 'bloque', 403, 'Votre fiche est bloquée par l\'équipe TerraClick. Contactez-la pour en savoir plus.');

        return $fiche;
    }

    private function sienne(Request $request, Demande $demande): Demande
    {
        $this->fiche($request);
        // DemandePolicy : le prestataire de la demande, avec la permission de l'espace pro.
        Gate::forUser($request->user())->authorize('traiterCommePrestataire', $demande);

        return $demande;
    }

    private function reponse(Demande $demande): DemandeProResource
    {
        return DemandeProResource::make($demande->load('quartier', 'client', 'evenements', 'signalements'));
    }
}
