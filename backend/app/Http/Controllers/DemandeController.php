<?php

namespace App\Http\Controllers;

use App\Http\Requests\Demande\CreerDemandeRequest;
use App\Http\Resources\DemandeResource;
use App\Models\Accord;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Services\AnalyseurBesoin;
use App\Services\CycleDemande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Demandes d'intervention du client connecté. */
class DemandeController extends Controller
{
    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** POST /api/demandes — « Confirmer ma demande ». Photos en multipart, trois au plus. */
    public function store(CreerDemandeRequest $request): JsonResponse
    {
        $donnees = $request->safe()->except('photos');
        // Pack pressing : prix et total recalculés depuis le catalogue, selon le service et l'express.
        $donnees['express'] = (bool) ($donnees['express'] ?? false);
        $donnees['articles'] = empty($donnees['articles']) ? null : Demande::composerPack($donnees['articles'], $donnees['service'] ?? null, $donnees['express']);

        if ($id = $donnees['prestataire_id'] ?? null) {
            $this->verifierTechnicien(Prestataire::findOrFail($id), $donnees['secteur']);
        }

        $demande = DB::transaction(function () use ($request, $donnees) {
            // Les frais de déplacement du quartier, tels qu'ils sont à l'envoi.
            $frais = Quartier::whereKey($donnees['quartier_id'])->value('frais_deplacement');
            $demande = Demande::create([...$donnees, 'user_id' => $request->user()->id, 'frais_deplacement' => $frais]);

            $photos = collect($request->file('photos', []))
                ->map(fn ($photo) => $photo->store("demandes/{$demande->id}", 'public'))
                ->all();
            if ($photos) {
                $demande->update(['photos' => $photos]);
            }

            // Toute demande envoyée à un prestataire (dépannage ou commande pressing) rejoint
            // aussitôt les onglets, où le client la suit jusqu'au bout.
            if ($demande->prestataire_id) {
                Accord::pourDemande($demande);
            }

            return $demande;
        });

        return DemandeResource::make($demande->refresh()->load('quartier', 'prestataire.quartier', 'accord'))
            ->additional(['message' => $demande->articles ? 'Votre commande est envoyée au pressing.' : 'Votre demande est envoyée. Vous recevrez une réponse dans environ 10 minutes.'])
            ->response()
            ->setStatusCode(201);
    }

    /** GET /api/demandes — les demandes du client, les plus récentes d'abord. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $demandes = Demande::query()->whereBelongsTo($request->user(), 'client')
            ->with('quartier', 'prestataire.quartier')
            ->when($request->query('statut'), fn ($q, $statut) => $q->whereIn('statut', explode(',', (string) $statut)))
            ->latest()->latest('id')->paginate(min(100, max(1, (int) $request->query('par_page', 20))));

        return DemandeResource::collection($demandes);
    }

    /** GET /api/demandes/{demande} — seul son auteur la voit, avec son suivi. */
    public function show(Request $request, Demande $demande): DemandeResource
    {
        $this->verifierAuteur($request, $demande);

        return DemandeResource::make($demande->load('quartier', 'prestataire.quartier', 'evenements', 'signalements', 'accord'));
    }

    /** POST /api/demandes/{demande}/annuler — tant que l'intervention n'a pas commencé. */
    public function annuler(Request $request, Demande $demande, CycleDemande $cycle): DemandeResource
    {
        $this->verifierAuteur($request, $demande);
        $motif = $request->validate(['motif' => ['nullable', 'string', 'max:500']])['motif'] ?? null;

        return DemandeResource::make($cycle->appliquer($demande, 'annuler', $request->user(), $motif)->load('quartier', 'prestataire.quartier', 'evenements', 'signalements', 'accord'));
    }

    /** POST /api/demandes/{demande}/confirmer — le client confirme la fin de l'intervention. */
    public function confirmer(Request $request, Demande $demande, CycleDemande $cycle): DemandeResource
    {
        $this->verifierAuteur($request, $demande);

        return DemandeResource::make($cycle->appliquer($demande, 'confirmer', $request->user())->load('quartier', 'prestataire.quartier', 'evenements', 'signalements', 'accord'));
    }

    /** POST /api/demandes/{demande}/signalements — retard, vêtement manquant, erreur, article endommagé. */
    public function signaler(Request $request, Demande $demande): JsonResponse
    {
        $this->verifierAuteur($request, $demande);
        $donnees = $request->validate([
            'motif' => ['required', Rule::in(array_keys($demande->motifsSignalement()))],
            'message' => [Rule::requiredIf($request->input('motif') === 'autre'), 'nullable', 'string', 'max:1000'],
            'photos' => ['nullable', 'array', 'max:3'],
            'photos.*' => ['file', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
        ], [
            'motif.required' => 'Choisissez ce qui ne va pas.',
            'message.required' => 'Décrivez le problème en quelques mots.',
            'photos.max' => 'Trois photos au plus.',
            'photos.*.mimetypes' => 'Une photo au format JPEG, PNG ou WebP.',
        ]);

        $photos = collect($request->file('photos', []))->map(fn ($p) => $p->store("signalements/{$demande->id}", 'public'))->all();
        $demande->signalements()->create([...collect($donnees)->except('photos')->all(), 'photos' => $photos ?: null, 'role' => 'client', 'user_id' => $request->user()->id]);

        return DemandeResource::make($demande->load('quartier', 'prestataire.quartier', 'evenements', 'signalements', 'accord'))
            ->additional(['message' => 'Votre signalement est transmis. Le prestataire et TerraClick vont le traiter.'])
            ->response()
            ->setStatusCode(201);
    }

    /** Seul le client de la demande agit dessus (DemandePolicy) ; pour les autres, elle n'existe pas. */
    private function verifierAuteur(Request $request, Demande $demande): void
    {
        Gate::forUser($request->user())->authorize('gererCommeClient', $demande);
    }

    /** Le technicien demandé doit être référencé et exercer le service demandé. */
    private function verifierTechnicien(Prestataire $prestataire, string $secteur): void
    {
        $categories = $this->analyseur->secteursOuverts()[$secteur]['categories'] ?? [];

        if (! $prestataire->estVisible() || ! $prestataire->categories()->whereIn('categories.slug', $categories)->exists()) {
            throw ValidationException::withMessages([
                'prestataire_id' => 'Ce technicien ne propose pas ce service.',
            ]);
        }
    }
}
