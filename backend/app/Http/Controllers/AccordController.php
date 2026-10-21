<?php

namespace App\Http\Controllers;

use App\Http\Resources\AccordResource;
use App\Models\Accord;
use App\Models\Prestataire;
use App\Models\Prestation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Onglets du client : les relations abouties. Le client confirme lui-même qu'il a conclu avec
 * un technicien, quel que soit le moyen par lequel il l'a joint.
 */
class AccordController extends Controller
{
    private const RELATIONS = [
        'prestataire.quartier', 'prestataire.categories', 'prestation',
        'demande.quartier', 'demande.prestataire.quartier', 'demande.evenements', 'demande.signalements', 'demande.accord',
    ];

    /**
     * GET /api/accords?etat=onglets|historique — les onglets (en cours) ou l'historique
     * (dépannages accomplis, du plus récent au plus ancien) ; sans filtre, tout.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $etat = $request->validate(['etat' => ['nullable', Rule::in(['onglets', 'historique'])]])['etat'] ?? null;

        $accords = Accord::whereBelongsTo($request->user(), 'client')->with(self::RELATIONS)
            ->when($etat === 'historique', fn ($q) => $q->accomplis()->orderByDesc('termine_le'))
            ->when($etat === 'onglets', fn ($q) => $q->whereNotIn('id', Accord::query()->accomplis()->select('id')))
            ->latest()->latest('id')->get();

        return AccordResource::collection($accords);
    }

    /** POST /api/accords — « Oui, j'ai conclu avec ce technicien ». */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'prestataire_id' => ['required', 'integer', 'exists:prestataires,id'],
            'prestation' => ['nullable', 'string', 'exists:prestations,slug'],
            'objet' => ['nullable', 'string', 'max:160'],
            'recherche' => ['nullable', 'string', 'max:255'],
            'canal' => ['required', Rule::in(Accord::CANAUX)],
            'montant' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'date_intervention' => ['nullable', 'date'],
        ], [
            'canal.in' => 'Indiquez comment vous avez joint le technicien.',
            'montant.integer' => 'Le montant est un nombre en francs CFA.',
        ]);

        $pro = Prestataire::findOrFail($donnees['prestataire_id']);
        abort_unless($pro->estVisible(), 422, 'Ce technicien n\'est plus référencé.');
        $prestation = isset($donnees['prestation']) ? Prestation::where('slug', $donnees['prestation'])->first() : null;

        $accord = Accord::create([
            'user_id' => $request->user()->id,
            'prestataire_id' => $pro->id,
            'prestation_id' => $prestation?->id,
            'objet' => trim((string) ($donnees['objet'] ?? '')) ?: ($prestation?->nom ?? "Intervention {$pro->metier}"),
            'recherche' => $donnees['recherche'] ?? null,
            'canal' => $donnees['canal'],
            'montant' => $donnees['montant'] ?? null,
            'date_intervention' => $donnees['date_intervention'] ?? null,
        ]);

        return AccordResource::make($accord->load(self::RELATIONS))
            ->additional(['message' => 'Accord enregistré dans vos onglets.'])
            ->response()
            ->setStatusCode(201);
    }

    /** GET /api/accords/{accord} — l'onglet et son reçu. */
    public function show(Request $request, Accord $accord): AccordResource
    {
        $this->verifierAuteur($request, $accord);

        return AccordResource::make($accord->load(self::RELATIONS));
    }

    /** POST /api/accords/{accord}/terminer — le dépannage est fait. */
    public function terminer(Request $request, Accord $accord): AccordResource
    {
        $this->verifierAuteur($request, $accord);
        if ($accord->statut !== 'termine') {
            $accord->update(['statut' => 'termine', 'termine_le' => now()]);
        }

        return AccordResource::make($accord->load(self::RELATIONS));
    }

    private function verifierAuteur(Request $request, Accord $accord): void
    {
        abort_unless($accord->user_id === $request->user()->id, 404, 'Onglet introuvable.');
    }
}
