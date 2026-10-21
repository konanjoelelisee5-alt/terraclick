<?php

namespace App\Http\Controllers;

use App\Http\Requests\Demande\CreerDemandeRequest;
use App\Http\Resources\DemandeResource;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Services\AnalyseurBesoin;
use App\Services\CycleDemande;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Demandes d'intervention du client connecté. */
class DemandeController extends Controller
{
    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** POST /api/demandes — « Confirmer ma demande ». Photos en multipart, trois au plus. */
    public function store(CreerDemandeRequest $request): JsonResponse
    {
        $donnees = $request->safe()->except('photos');

        if ($id = $donnees['prestataire_id'] ?? null) {
            $this->verifierTechnicien(Prestataire::findOrFail($id), $donnees['secteur']);
        }

        $demande = DB::transaction(function () use ($request, $donnees) {
            $demande = Demande::create([...$donnees, 'user_id' => $request->user()->id]);

            $photos = collect($request->file('photos', []))
                ->map(fn ($photo) => $photo->store("demandes/{$demande->id}", 'public'))
                ->all();
            if ($photos) {
                $demande->update(['photos' => $photos]);
            }

            return $demande;
        });

        return DemandeResource::make($demande->refresh()->load('quartier', 'prestataire.quartier'))
            ->additional(['message' => 'Votre demande est envoyée. Vous recevrez une réponse dans environ 10 minutes.'])
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

        return DemandeResource::make($demande->load('quartier', 'prestataire.quartier', 'evenements'));
    }

    /** POST /api/demandes/{demande}/annuler — tant que l'intervention n'a pas commencé. */
    public function annuler(Request $request, Demande $demande, CycleDemande $cycle): DemandeResource
    {
        $this->verifierAuteur($request, $demande);
        $motif = $request->validate(['motif' => ['nullable', 'string', 'max:500']])['motif'] ?? null;

        return DemandeResource::make($cycle->appliquer($demande, 'annuler', $request->user(), $motif)->load('quartier', 'prestataire.quartier', 'evenements'));
    }

    /** POST /api/demandes/{demande}/confirmer — le client confirme la fin de l'intervention. */
    public function confirmer(Request $request, Demande $demande, CycleDemande $cycle): DemandeResource
    {
        $this->verifierAuteur($request, $demande);

        return DemandeResource::make($cycle->appliquer($demande, 'confirmer', $request->user())->load('quartier', 'prestataire.quartier', 'evenements'));
    }

    private function verifierAuteur(Request $request, Demande $demande): void
    {
        abort_unless($demande->user_id === $request->user()->id, 404, 'Demande introuvable.');
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
