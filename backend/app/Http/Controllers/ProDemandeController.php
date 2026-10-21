<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeProResource;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Services\CycleDemande;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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

    /** La fiche de technicien reliée au compte ; sans fiche, l'espace pro est fermé. */
    private function fiche(Request $request): Prestataire
    {
        $fiche = Prestataire::where('user_id', $request->user()->id)->first();
        abort_unless($fiche !== null, 403, 'Votre compte n\'est pas relié à une fiche de technicien.');

        return $fiche;
    }

    private function sienne(Request $request, Demande $demande): Demande
    {
        abort_unless($demande->prestataire_id === $this->fiche($request)->id, 404, 'Demande introuvable.');

        return $demande;
    }

    private function reponse(Demande $demande): DemandeProResource
    {
        return DemandeProResource::make($demande->load('quartier', 'client', 'evenements'));
    }
}
