<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeResource;
use App\Models\DemandeEvenement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cloche du client : ce que les prestataires ont fait sur ses demandes et commandes
 * (commande confirmée, agent en route, linge prêt, livraison en cours…), du plus récent au
 * plus ancien. Ses propres actions n'y figurent pas.
 */
class NotificationController extends Controller
{
    /** Textes propres au pressing ; les autres étapes reprennent leur libellé. */
    private const PRESSING = [
        'acceptee' => ['Commande confirmée', ':pro a confirmé votre commande.'],
        'refusee' => ['Commande refusée', ':pro ne peut pas prendre votre commande.'],
        'agent_en_route' => ['Agent en route', 'L\'agent de :pro arrive pour collecter votre linge.'],
        'collectee' => ['Linge collecté', 'Votre linge est en route vers :pro.'],
        'recue' => ['Linge reçu au pressing', ':pro a bien reçu votre linge.'],
        'en_traitement' => ['En traitement', 'Votre linge est en cours de traitement.'],
        'prete' => ['Linge prêt', 'Votre commande est prête chez :pro.'],
        'en_livraison' => ['Livraison en cours', 'Votre linge arrive.'],
        'livree' => ['Commande livrée', 'Confirmez la livraison et notez :pro dans vos onglets.'],
    ];

    private const AUTRES = [
        'acceptee' => ['Demande acceptée', ':pro a accepté votre demande.'],
        'refusee' => ['Demande refusée', ':pro ne peut pas intervenir.'],
        'en_cours' => ['Intervention en cours', ':pro a commencé l\'intervention.'],
        'terminee' => ['Intervention terminée', 'Confirmez la fin de l\'intervention de :pro.'],
    ];

    /** GET /api/notifications */
    public function __invoke(Request $request): JsonResponse
    {
        $evenements = DemandeEvenement::query()
            ->where('auteur', '!=', 'client')
            ->whereHas('demande', fn ($q) => $q->where('user_id', $request->user()->id))
            ->with('demande.prestataire', 'demande.accord')
            ->latest('id')
            ->limit(50)
            ->get();

        return response()->json(['data' => $evenements->map(function (DemandeEvenement $e) {
            $d = $e->demande;
            $pro = $d->prestataire?->nom ?? 'Le prestataire';
            [$titre, $texte] = ($d->estPressing() ? self::PRESSING : self::AUTRES)[$e->statut]
                ?? [DemandeResource::libelleStatut($e->statut), $d->reference];

            return [
                'id' => $e->id,
                'statut' => $e->statut,
                'titre' => $titre,
                'texte' => str_replace(':pro', $pro, $texte).($e->message ? " « {$e->message} »" : ''),
                'pressing' => $d->estPressing(),
                'demande_id' => $d->id,
                'accord_id' => $d->accord?->id,
                'date' => $e->created_at?->toIso8601String(),
            ];
        })]);
    }
}
