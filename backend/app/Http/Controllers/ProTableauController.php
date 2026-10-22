<?php

namespace App\Http\Controllers;

use App\Http\Resources\DemandeResource;
use App\Models\Commission;
use App\Models\Demande;
use App\Models\PaiementCommission;
use App\Models\Prestataire;
use App\Models\Secteur;
use App\Support\Telephone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Tableau de bord du prestataire, selon son secteur : trois indicateurs (un pressing suit ses
 * commandes et ses pièces, un technicien les demandes à répondre et ses missions), les demandes
 * reçues jour par jour sur la semaine, ses clients récents et le suivi de ses dernières demandes.
 */
class ProTableauController extends Controller
{
    /** Avancement d'une intervention, selon son statut (en %). */
    private const AVANCEMENT = ['envoyee' => 0, 'acceptee' => 33, 'en_cours' => 66, 'terminee' => 90, 'confirmee' => 100, 'refusee' => 0, 'annulee' => 0];

    /** GET /api/pro/tableau?semaine=0|1 — 0 : cette semaine, 1 : la précédente. */
    public function __invoke(Request $request): JsonResponse
    {
        $semaine = (int) ($request->validate(['semaine' => ['nullable', 'integer', 'in:0,1']])['semaine'] ?? 0);
        $fiche = Prestataire::where('user_id', $request->user()->id)->with('categories:id,slug')->first();
        abort_unless($fiche !== null, 403, 'Votre compte n\'est pas relié à une fiche de prestataire.');
        abort_if($fiche->statut === 'bloque', 403, 'Votre fiche est bloquée par l\'équipe TerraClick. Contactez-la pour en savoir plus.');

        $slugs = $fiche->categories->pluck('slug')->all();
        $secteurs = collect(Secteur::catalogue())->filter(fn (array $s) => array_intersect($slugs, $s['categories']));
        $pressing = $secteurs->has('pressing') && $secteurs->count() === 1;
        $mois = now()->startOfMonth();

        $demandes = $fiche->demandes()->with('quartier', 'client', 'accord')->latest('id')->get();
        $accomplies = $demandes->whereIn('statut', ['terminee', 'confirmee'])->filter(fn (Demande $d) => $d->updated_at->gte($mois));
        $pieces = (int) $accomplies->sum(fn (Demande $d) => array_sum(array_column($d->articles ?? [], 'quantite')));

        $kpis = $pressing ? [
            ['cle' => 'en_cours', 'libelle' => 'Commandes en cours', 'valeur' => $demandes->whereIn('statut', ['acceptee', 'en_cours'])->count(), 'unite' => '', 'icone' => 'shirt'],
            ['cle' => 'pieces', 'libelle' => 'Pièces traitées ce mois', 'valeur' => $pieces, 'unite' => 'pièces', 'icone' => 'sparkles'],
        ] : [
            ['cle' => 'a_repondre', 'libelle' => 'Demandes à répondre', 'valeur' => $demandes->where('statut', 'envoyee')->count(), 'unite' => '', 'icone' => 'inbox'],
            ['cle' => 'missions', 'libelle' => 'Missions ce mois', 'valeur' => $accomplies->count(), 'unite' => '', 'icone' => $secteurs->first()['icone'] ?? 'wrench'],
        ];
        $kpis[] = ['cle' => 'note', 'libelle' => 'Note des clients', 'valeur' => (float) $fiche->note_moyenne, 'unite' => '/5', 'icone' => 'star', 'detail' => "{$fiche->nombre_avis} avis"];

        // Les demandes reçues, jour par jour, du lundi au dimanche.
        $lundi = now()->startOfWeek(Carbon::MONDAY)->subWeeks($semaine);
        $jours = collect(range(0, 6))->map(function (int $i) use ($lundi, $demandes) {
            $jour = $lundi->copy()->addDays($i);

            return [
                'date' => $jour->toDateString(),
                'nombre' => $jour->isFuture() && ! $jour->isToday() ? null : $demandes->filter(fn (Demande $d) => $d->created_at->isSameDay($jour))->count(),
            ];
        });
        $passes = $jours->pluck('nombre')->filter(fn ($n) => $n !== null);

        $clients = $demandes->unique('user_id')->take(5)->map(function (Demande $d) {
            $mots = preg_split('/\s+/u', trim((string) $d->client?->nom), -1, PREG_SPLIT_NO_EMPTY);
            $joignable = in_array($d->statut, Demande::STATUTS_CONTACT, true);

            return [
                'nom' => $mots ? $mots[0].(isset($mots[1]) ? ' '.mb_substr($mots[1], 0, 1).'.' : '') : 'Client',
                'quartier' => $d->quartier?->nom,
                'statut_libelle' => DemandeResource::libelleStatut($d->statut),
                'telephone' => $joignable && $d->client ? Telephone::affichage($d->client->telephone) : null,
            ];
        })->values();

        $suivi = $demandes->take(12)->map(function (Demande $d) {
            $etapes = $d->estPressing() && $d->articles ? $d->etapesPressing() : [];
            $avancement = $etapes && in_array($d->statut, ['acceptee', 'en_cours'], true) && $d->etape
                ? (int) round((array_search($d->etape, $etapes, true) + 1) * 100 / count($etapes))
                : (self::AVANCEMENT[$d->statut] ?? 0);

            return [
                'id' => $d->id,
                'reference' => $d->reference,
                'intitule' => $d->articles ? 'Commande · '.array_sum(array_column($d->articles, 'quantite')).' pièces' : $d->probleme,
                'quartier' => $d->quartier?->nom,
                'avancement' => $avancement,
                'recue_le' => $d->created_at?->toIso8601String(),
                'creneau' => $d->creneau ?? ($d->heure ? trim(($d->date_souhaitee?->format('d/m') ?? '').' '.$d->heure) : null),
                'statut' => $d->statut,
                'statut_libelle' => $d->etape ? DemandeResource::libelleStatut($d->etape) : DemandeResource::libelleStatut($d->statut),
                'montant' => Commission::montantMission($d),
            ];
        })->values();

        $solde = (int) Commission::where('prestataire_id', $fiche->id)->sum('montant') - (int) PaiementCommission::where('prestataire_id', $fiche->id)->sum('montant');

        return response()->json(['data' => [
            'prenom' => explode(' ', (string) $request->user()->nom)[0] ?: $fiche->nom,
            'fiche' => [
                'id' => $fiche->id,
                'nom' => $fiche->nom,
                'metier' => $fiche->metier,
                'pressing' => $pressing,
                'secteurs' => $secteurs->map(fn (array $s, string $cle) => ['cle' => $cle, 'nom' => $s['nom'], 'icone' => $s['icone']])->values(),
                'statut' => $fiche->statut,
            ],
            'kpis' => $kpis,
            'semaine' => [
                'decalage' => $semaine,
                'jours' => $jours,
                'max' => $passes->max() ?? 0,
                'moyenne' => $passes->count() ? round($passes->avg(), 1) : 0,
            ],
            'clients' => $clients,
            'suivi' => $suivi,
            'commission_due' => max(0, $solde),
        ]]);
    }
}
