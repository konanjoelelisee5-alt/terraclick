<?php

namespace App\Http\Controllers;

use App\Models\Accord;
use App\Models\Categorie;
use App\Models\Demande;
use App\Models\Departement;
use App\Models\Prestataire;
use App\Models\Prestation;
use App\Models\Rubrique;
use App\Models\Secteur;
use App\Services\AnalyseurBesoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * « Secteurs d'activité » : l'administrateur crée, modifie, active et classe les secteurs,
 * définit leurs sous-services (prestations) et suit leurs chiffres. Ce qu'il change se voit
 * aussitôt dans l'application client (accueil, recherche, demandes).
 */
class AdminSecteurController extends Controller
{
    /** Statuts d'une intervention menée à bien (terminée, ou confirmée par le client). */
    private const REUSSIES = ['terminee', 'confirmee'];

    public function __construct(private readonly AnalyseurBesoin $analyseur) {}

    /** GET /api/admin/secteurs — tous les secteurs, leurs chiffres, leurs sous-services. */
    public function index(): JsonResponse
    {
        $secteurs = Secteur::query()->classes()->with('prestations')->get();
        $statuts = "'".implode("','", self::REUSSIES)."'";
        $demandes = Demande::query()
            ->selectRaw("secteur, COUNT(*) AS total, SUM(CASE WHEN statut IN ({$statuts}) THEN 1 ELSE 0 END) AS reussies")
            ->groupBy('secteur')->get()->keyBy('secteur');
        $montants = Accord::query()->join('demandes', 'demandes.id', '=', 'accords.demande_id')
            ->whereIn('demandes.statut', self::REUSSIES)
            ->groupBy('demandes.secteur')->selectRaw('demandes.secteur, SUM(accords.montant) AS total')
            ->pluck('total', 'secteur');
        $techniciens = DB::table('prestataire_prestation')->selectRaw('prestation_id, COUNT(*) AS n')->groupBy('prestation_id')->pluck('n', 'prestation_id');

        return response()->json(['data' => [
            'secteurs' => $secteurs->map(fn (Secteur $s) => $this->enTableau($s, [
                'demandes' => (int) ($demandes[$s->cle]->total ?? 0),
                'reussies' => (int) ($demandes[$s->cle]->reussies ?? 0),
                'montant_reussies' => (int) ($montants[$s->cle] ?? 0),
                'prestataires' => Prestataire::where('actif', true)->whereHas('categories', fn ($q) => $q->whereIn('slug', $s->categories))->count(),
            ], $techniciens)),
            'icones' => config('secteurs_affichage.icones'),
            'couleurs' => collect(config('secteurs_affichage.couleurs'))->map(fn (string $nom, string $hex) => ['hex' => $hex, 'nom' => $nom])->values(),
            'categories' => Categorie::query()->join('rubriques', 'rubriques.id', '=', 'categories.rubrique_id')
                ->orderBy('rubriques.nom')->orderBy('categories.nom')
                ->get(['categories.slug', 'categories.nom', 'rubriques.nom as rubrique']),
        ]]);
    }

    /** POST /api/admin/secteurs — un secteur neuf, désactivé tant que l'administrateur ne l'ouvre pas. */
    public function store(Request $request): JsonResponse
    {
        $donnees = $this->valider($request, null);
        $cle = $this->cleLibre($donnees['nom']);

        $secteur = DB::transaction(function () use ($donnees, $cle) {
            $categories = $donnees['categories'] ?? [];
            if ($categories === []) {
                $categories = [$this->creerCategorie($donnees['metier'] ?? $donnees['nom'])];
            }

            return Secteur::create([
                ...$donnees,
                'cle' => $cle,
                'actif' => (bool) ($donnees['actif'] ?? false),
                'ordre' => (int) Secteur::max('ordre') + 1,
                'categories' => $categories,
                'problemes' => $donnees['problemes'] ?? [],
                'mots' => $this->vocabulaire($donnees['mots'] ?? [], [], [$donnees['nom'], $donnees['metier'] ?? '']),
            ]);
        });

        return response()->json(['data' => $this->enTableau($secteur->load('prestations'))], 201);
    }

    /** PATCH /api/admin/secteurs/{secteur} — nom, description, icône, couleur, activation… */
    public function update(Request $request, Secteur $secteur): JsonResponse
    {
        $donnees = $this->valider($request, $secteur);
        if (array_key_exists('mots', $donnees)) {
            $donnees['mots'] = $this->vocabulaire($donnees['mots'], $secteur->mots ?? [], []);
        }
        if (array_key_exists('categories', $donnees) && $donnees['categories'] === []) {
            return response()->json(['message' => 'Un secteur ouvre au moins une catégorie de l\'annuaire.', 'errors' => ['categories' => ['Choisissez au moins une catégorie.']]], 422);
        }
        $secteur->update($donnees);

        return response()->json(['data' => $this->enTableau($secteur->load('prestations'))]);
    }

    /** PUT /api/admin/secteurs/ordre — l'ordre d'affichage sur l'accueil client. */
    public function ordonner(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ordre' => ['required', 'array', 'min:1'],
            'ordre.*' => ['integer', 'distinct', 'exists:secteurs,id'],
        ])['ordre'];

        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $position => $id) {
                Secteur::whereKey($id)->update(['ordre' => $position + 1]);
            }
        });
        Secteur::oublier();

        return response()->json(['data' => Secteur::query()->classes()->pluck('id')]);
    }

    /** POST /api/admin/secteurs/{secteur}/prestations — un sous-service, avec son prix indicatif. */
    public function ajouterPrestation(Request $request, Secteur $secteur): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => ['required', 'string', 'min:3', 'max:120', Rule::unique('prestations', 'nom')->where('secteur', $secteur->cle)],
            'description' => ['nullable', 'string', 'max:255'],
            'prix_min' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'prix_max' => ['nullable', 'integer', 'min:0', 'max:10000000', 'gte:prix_min'],
            'unite' => ['nullable', 'string', 'max:30'],
        ], [
            'nom.unique' => 'Ce sous-service existe déjà dans ce secteur.',
            'prix_max.gte' => 'Le prix maximum doit être supérieur ou égal au minimum.',
        ]);

        $prestation = Prestation::create([
            ...$donnees,
            'secteur' => $secteur->cle,
            'slug' => $this->slugLibre($donnees['nom']),
            'mots' => $this->vocabulaire([], [], [$donnees['nom']], 2),
            'ordre' => (int) $secteur->prestations()->max('ordre') + 1,
        ]);
        Secteur::oublier();

        return response()->json(['data' => $this->sousService($prestation)], 201);
    }

    /** PATCH /api/admin/sous-services/{prestation} — renommer, décrire, activer ou désactiver. */
    public function modifierPrestation(Request $request, Prestation $prestation): JsonResponse
    {
        $donnees = $request->validate([
            'nom' => ['sometimes', 'string', 'min:3', 'max:120', Rule::unique('prestations', 'nom')->where('secteur', $prestation->secteur)->ignore($prestation->id)],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'actif' => ['sometimes', 'boolean'],
        ], ['nom.unique' => 'Ce sous-service existe déjà dans ce secteur.']);
        $prestation->update($donnees);
        Secteur::oublier();

        return response()->json(['data' => $this->sousService($prestation)]);
    }

    /** @return array<string, mixed> */
    private function valider(Request $request, ?Secteur $secteur): array
    {
        $requis = $secteur ? 'sometimes' : 'required';

        return $request->validate([
            'nom' => [$requis, 'string', 'min:3', 'max:80', Rule::unique('secteurs', 'nom')->ignore($secteur?->id)],
            'metier' => ['sometimes', 'nullable', 'string', 'max:80'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'icone' => [$requis, 'string', Rule::in(config('secteurs_affichage.icones'))],
            'couleur' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'actif' => ['sometimes', 'boolean'],
            'categories' => ['sometimes', 'array', 'max:10'],
            'categories.*' => ['string', 'distinct', 'exists:categories,slug'],
            'problemes' => ['sometimes', 'array', 'max:8'],
            'problemes.*' => ['string', 'min:3', 'max:60', 'distinct'],
            'mots' => ['sometimes', 'array', 'max:80'],
            'mots.*' => ['string', 'min:2', 'max:40'],
        ], [
            'nom.unique' => 'Un secteur porte déjà ce nom.',
            'icone.in' => 'Choisissez une icône de la liste.',
            'couleur.regex' => 'La couleur s\'écrit #RRGGBB.',
            'problemes.max' => 'Huit problèmes au plus : le client les voit d\'un coup d\'œil.',
        ]);
    }

    /**
     * Vocabulaire de recherche : les mots choisis gardent leur poids, un mot neuf vaut 2 ; le nom
     * et le métier reconnaissent leurs variantes (« peinture », « peintre » → « peint* », poids 3).
     *
     * @param  list<string>  $mots
     * @param  array<string, int>  $existants
     * @param  list<string>  $racines
     * @return array<string, int>
     */
    private function vocabulaire(array $mots, array $existants, array $racines, int $poidsRacine = 3): array
    {
        $vocabulaire = [];
        foreach ($racines as $texte) {
            foreach (explode(' ', $this->analyseur->normaliser($texte)) as $mot) {
                if (strlen($mot) >= 4) {
                    $vocabulaire[substr($mot, 0, max(4, strlen($mot) - 3)).'*'] = $poidsRacine;
                }
            }
        }
        foreach ($mots as $mot) {
            $etoile = str_ends_with(trim($mot), '*');
            $cle = $this->analyseur->normaliser($mot).($etoile ? '*' : '');
            if (trim($cle, '*') !== '') {
                $vocabulaire[$cle] = $existants[$cle] ?? $vocabulaire[$cle] ?? 2;
            }
        }

        return $vocabulaire;
    }

    private function cleLibre(string $nom): string
    {
        $base = Str::limit(Str::slug($nom, ''), 36, '') ?: 'secteur';
        $cle = $base;
        for ($i = 2; Secteur::where('cle', $cle)->exists(); $i++) {
            $cle = "{$base}{$i}";
        }

        return $cle;
    }

    private function slugLibre(string $nom): string
    {
        $base = Str::limit(Str::slug($nom), 110, '');
        $slug = $base;
        for ($i = 2; Prestation::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    /** Catégorie de l'annuaire d'un secteur neuf : c'est là que ses prestataires seront rangés. */
    private function creerCategorie(string $nom): string
    {
        $reglage = config('secteurs_affichage.rubrique_nouveaux');
        $departement = Departement::where('nom', $reglage['departement'])->first() ?? Departement::orderBy('ordre')->firstOrFail();
        $rubrique = Rubrique::firstOrCreate(
            ['departement_id' => $departement->id, 'slug' => Str::slug($reglage['nom'])],
            ['nom' => $reglage['nom'], 'ordre' => (int) $departement->rubriques()->max('ordre') + 1],
        );

        $slug = Str::slug($nom);
        for ($i = 2; Categorie::where('slug', $slug)->exists(); $i++) {
            $slug = Str::slug($nom)."-{$i}";
        }
        Categorie::create(['rubrique_id' => $rubrique->id, 'nom' => $nom, 'slug' => $slug, 'ordre' => (int) $rubrique->categories()->max('ordre') + 1]);

        return $slug;
    }

    /**
     * @param  array<string, int>|null  $chiffres
     * @param  Collection<int, int>|null  $techniciens
     * @return array<string, mixed>
     */
    private function enTableau(Secteur $s, ?array $chiffres = null, $techniciens = null): array
    {
        return [
            'id' => $s->id,
            'cle' => $s->cle,
            'nom' => $s->nom,
            'metier' => $s->metier,
            'description' => $s->description,
            'icone' => $s->icone,
            'couleur' => $s->couleur,
            'actif' => $s->actif,
            'ordre' => $s->ordre,
            'categories' => $s->categories,
            'problemes' => $s->problemes,
            'mots' => array_keys($s->mots ?? []),
            'chiffres' => $chiffres ?? ['demandes' => 0, 'reussies' => 0, 'montant_reussies' => 0, 'prestataires' => 0],
            'prestations' => $s->prestations->map(fn (Prestation $p) => $this->sousService($p, (int) ($techniciens[$p->id] ?? 0)))->values(),
        ];
    }

    /** @return array<string, mixed> */
    private function sousService(Prestation $p, ?int $techniciens = null): array
    {
        return [
            'id' => $p->id,
            'nom' => $p->nom,
            'description' => $p->description,
            'actif' => (bool) ($p->actif ?? true),
            'prix_min' => $p->prix_min,
            'prix_max' => $p->prix_max,
            'prix_affichage' => $p->prixAffiche(),
            'prestataires' => $techniciens ?? $p->prestataires()->count(),
        ];
    }
}
