<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use App\Models\Demande;
use App\Models\PaiementCommission;
use App\Models\Prestataire;
use App\Models\Reglage;
use App\Models\Secteur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * « Finances » : commission globale et par secteur, négociation directe, moyens de paiement ;
 * montants encaissés par les prestataires, commissions dues, paiements de commission reçus,
 * prestataires en retard de paiement ; rapports à exporter (CSV, ouvrable dans Excel).
 *
 * Aucun argent ne passe par TerraClick : le client paie le prestataire, qui verse ensuite sa
 * commission ; l'équipe enregistre ce versement. Le solde d'un prestataire = commissions − paiements.
 */
class AdminFinanceController extends Controller
{
    /** GET /api/admin/finances?du=&au= */
    public function index(Request $request): JsonResponse
    {
        [$du, $au] = $this->periode($request);
        $missions = $this->missions($du, $au);
        $commissions = Commission::whereBetween('created_at', [$du, $au])->get();
        $paiements = PaiementCommission::with('prestataire', 'auteur')->whereBetween('paye_le', [$du->toDateString(), $au->toDateString()])->latest('paye_le')->latest('id')->get();
        $soldes = $this->soldes();

        $ids = $missions->pluck('prestataire_id')->merge($commissions->pluck('prestataire_id'))->merge($paiements->pluck('prestataire_id'))->merge($soldes->keys())->unique();
        $noms = Prestataire::whereIn('id', $ids)->pluck('nom', 'id');

        $prestataires = $ids->map(fn (int $id) => [
            'id' => $id,
            'nom' => $noms[$id] ?? '—',
            'missions' => $missions->where('prestataire_id', $id)->count(),
            'encaisse' => (int) $missions->where('prestataire_id', $id)->sum('montant'),
            'commissions' => (int) $commissions->where('prestataire_id', $id)->sum('montant'),
            'paye' => (int) $paiements->where('prestataire_id', $id)->sum('montant'),
            'solde' => (int) ($soldes[$id] ?? 0),
            'dernier_paiement' => PaiementCommission::where('prestataire_id', $id)->max('paye_le'),
        ])->sortByDesc('solde')->values();

        return response()->json(['data' => [
            'periode' => ['du' => $du->toDateString(), 'au' => $au->toDateString()],
            'reglages' => Reglage::tous(),
            'moyens' => collect(config('finances.moyens'))->map(fn (array $m, string $cle) => ['cle' => $cle, 'libelle' => $m[0], 'detail' => $m[1]])->values(),
            'secteurs' => Secteur::query()->classes()->get(['cle', 'nom', 'commission', 'actif'])->map(fn (Secteur $s) => ['cle' => $s->cle, 'nom' => $s->nom, 'commission' => $s->commission !== null ? (float) $s->commission : null, 'actif' => $s->actif]),
            'totaux' => [
                'missions' => $missions->count(),
                'encaisse' => (int) $missions->sum('montant'),
                'commissions' => (int) $commissions->sum('montant'),
                'paye' => (int) $paiements->sum('montant'),
                // Tout ce qui reste dû, toutes périodes confondues.
                'reste_du' => (int) $soldes->filter(fn ($s) => $s > 0)->sum(),
                'impayes' => $soldes->filter(fn ($s) => $s > 0)->count(),
            ],
            'prestataires' => $prestataires,
            'paiements' => $paiements->take(50)->map(fn (PaiementCommission $p) => $this->paiement($p))->values(),
        ]]);
    }

    /** PUT /api/admin/finances/reglages */
    public function reglages(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'commission_taux' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:50'],
            'negociation_directe' => ['sometimes', 'boolean'],
            'paiements' => ['sometimes', 'array', 'min:1'],
            'paiements.*' => ['string', 'distinct', Rule::in(array_keys(config('finances.moyens')))],
            'seuil_recidive' => ['sometimes', 'integer', 'min:0', 'max:20'],
        ], [
            'paiements.min' => 'Gardez au moins un moyen de paiement.',
            'commission_taux.max' => 'La commission ne dépasse pas 50 %.',
        ]);
        foreach ($donnees as $cle => $valeur) {
            Reglage::ecrire($cle, $cle === 'commission_taux' && $valeur !== null ? (float) $valeur : $valeur);
        }

        return response()->json(['data' => Reglage::tous()]);
    }

    /** PUT /api/admin/finances/secteurs — commission propre à un secteur (null : le taux global). */
    public function secteurs(Request $request): JsonResponse
    {
        $taux = $request->validate([
            'commissions' => ['required', 'array'],
            'commissions.*' => ['nullable', 'numeric', 'min:0', 'max:50'],
        ])['commissions'];
        foreach ($taux as $cle => $valeur) {
            Secteur::where('cle', $cle)->update(['commission' => $valeur]);
        }

        return response()->json(['data' => Secteur::query()->classes()->get(['cle', 'commission'])]);
    }

    /** POST /api/admin/finances/paiements — un versement de commission reçu d'un prestataire. */
    public function payer(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'prestataire_id' => ['required', 'integer', 'exists:prestataires,id'],
            'montant' => ['required', 'integer', 'min:1', 'max:100000000'],
            'moyen' => ['required', Rule::in(array_keys(config('finances.moyens')))],
            'reference' => ['nullable', 'string', 'max:80'],
            'note' => ['nullable', 'string', 'max:500'],
            'paye_le' => ['nullable', 'date', 'before_or_equal:today'],
        ], ['montant.required' => 'Indiquez le montant reçu.', 'paye_le.before_or_equal' => 'La date ne peut pas être future.']);

        $paiement = PaiementCommission::create([...$donnees, 'paye_le' => $donnees['paye_le'] ?? now()->toDateString(), 'user_id' => $request->user()->id]);

        return response()->json(['data' => [...$this->paiement($paiement->load('prestataire', 'auteur')), 'solde' => (int) ($this->soldes()[$paiement->prestataire_id] ?? 0)]], 201);
    }

    /** GET /api/admin/finances/export?rapport=missions|prestataires|paiements&du=&au= — CSV pour Excel. */
    public function exporter(Request $request): StreamedResponse
    {
        $rapport = $request->validate(['rapport' => ['required', Rule::in(['missions', 'prestataires', 'paiements'])]])['rapport'];
        [$du, $au] = $this->periode($request);
        $donnees = $this->index($request)->getData(true)['data'];

        [$entetes, $lignes] = match ($rapport) {
            'missions' => [
                ['Référence', 'Date', 'Secteur', 'Prestataire', 'Montant encaissé (F)', 'Taux (%)', 'Commission (F)'],
                $this->missions($du, $au)->map(fn (array $m) => [$m['reference'], $m['date'], $m['secteur'], $m['prestataire'], $m['montant'], $m['taux'] ?? '', $m['commission'] ?? '']),
            ],
            'prestataires' => [
                ['Prestataire', 'Missions', 'Encaissé (F)', 'Commissions de la période (F)', 'Payé sur la période (F)', 'Reste dû (F)', 'Dernier paiement'],
                collect($donnees['prestataires'])->map(fn (array $p) => [$p['nom'], $p['missions'], $p['encaisse'], $p['commissions'], $p['paye'], $p['solde'], $p['dernier_paiement'] ?? '']),
            ],
            'paiements' => [
                ['Date', 'Prestataire', 'Montant (F)', 'Moyen', 'Référence', 'Note', 'Enregistré par'],
                collect($donnees['paiements'])->map(fn (array $p) => [$p['paye_le'], $p['prestataire'], $p['montant'], $p['moyen_libelle'], $p['reference'] ?? '', $p['note'] ?? '', $p['par'] ?? '']),
            ],
        };

        $nom = "terraclick-{$rapport}-{$du->toDateString()}-{$au->toDateString()}.csv";

        return response()->streamDownload(function () use ($entetes, $lignes) {
            $sortie = fopen('php://output', 'w');
            fwrite($sortie, "\xEF\xBB\xBF");
            fputcsv($sortie, $entetes, ';');
            foreach ($lignes as $ligne) {
                fputcsv($sortie, $ligne, ';');
            }
            fclose($sortie);
        }, $nom, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return array{0: Carbon, 1: Carbon} la période demandée, le mois en cours par défaut */
    private function periode(Request $request): array
    {
        $p = $request->validate([
            'du' => ['nullable', 'date'],
            'au' => ['nullable', 'date', 'after_or_equal:du'],
        ], ['au.after_or_equal' => 'La date de fin doit suivre la date de début.']);

        return [
            isset($p['du']) ? Carbon::parse($p['du'])->startOfDay() : now()->startOfMonth(),
            isset($p['au']) ? Carbon::parse($p['au'])->endOfDay() : now()->endOfDay(),
        ];
    }

    /**
     * Les missions accomplies (confirmées) de la période, avec ce qu'a encaissé le prestataire.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function missions(Carbon $du, Carbon $au): Collection
    {
        return Demande::query()->where('statut', 'confirmee')->whereNotNull('prestataire_id')
            ->whereBetween('updated_at', [$du, $au])
            ->with('accord', 'prestataire', 'commission')->latest('updated_at')->get()
            ->map(fn (Demande $d) => [
                'reference' => $d->reference,
                'date' => $d->updated_at?->toDateString(),
                'secteur' => Secteur::nomDe($d->secteur),
                'prestataire_id' => $d->prestataire_id,
                'prestataire' => $d->prestataire?->nom,
                'montant' => (int) (Commission::montantMission($d) ?? 0),
                'taux' => $d->commission?->taux,
                'commission' => $d->commission?->montant,
            ]);
    }

    /** @return Collection<int, int> solde par prestataire, toutes périodes : commissions − paiements */
    private function soldes(): Collection
    {
        $dues = Commission::query()->selectRaw('prestataire_id, SUM(montant) AS total')->groupBy('prestataire_id')->pluck('total', 'prestataire_id');
        $payees = PaiementCommission::query()->selectRaw('prestataire_id, SUM(montant) AS total')->groupBy('prestataire_id')->pluck('total', 'prestataire_id');

        return $dues->keys()->merge($payees->keys())->unique()->mapWithKeys(fn ($id) => [(int) $id => (int) ($dues[$id] ?? 0) - (int) ($payees[$id] ?? 0)]);
    }

    /** @return array<string, mixed> */
    private function paiement(PaiementCommission $p): array
    {
        return [
            'id' => $p->id,
            'prestataire_id' => $p->prestataire_id,
            'prestataire' => $p->prestataire?->nom,
            'montant' => $p->montant,
            'moyen' => $p->moyen,
            'moyen_libelle' => config("finances.moyens.{$p->moyen}.0", $p->moyen),
            'reference' => $p->reference,
            'note' => $p->note,
            'par' => $p->auteur?->nom,
            'paye_le' => $p->paye_le?->toDateString(),
        ];
    }
}
