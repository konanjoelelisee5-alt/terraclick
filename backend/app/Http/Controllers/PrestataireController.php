<?php

namespace App\Http\Controllers;

use App\Http\Requests\Annuaire\RechercherPrestatairesRequest;
use App\Http\Resources\FicheProResource;
use App\Http\Resources\PrestataireResource;
use App\Models\Prestataire;
use App\Services\AnalyseurBesoin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PrestataireController extends Controller
{
    /** Rayon moyen de la Terre, pour le calcul de distance. */
    private const RAYON_TERRE_KM = 6371;

    /** Mots d'une phrase qui ne disent rien du besoin (comparés sans accents). */
    private const MOTS_VIDES = [
        'avec', 'besoin', 'bonjour', 'cherche', 'chercher', 'dans', 'depuis', 'elle', 'est', 'faire',
        'faut', 'leur', 'mais', 'merci', 'mettre', 'pour', 'quelqu', 'quelquun', 'sans', 'svp', 'tres',
        'trouver', 'urgent', 'veux', 'voudrais', 'votre', 'vous', 'nous', 'chez', 'maison', 'aujourd',
        'demain', 'matin', 'soir', 'hier', 'probleme', 'quelque', 'chose', 'personne', 'aide', 'aider',
    ];

    public function __construct(private AnalyseurBesoin $analyseur) {}

    /** GET /api/prestataires — recherche, filtres, « Autour de moi ». */
    public function index(RechercherPrestatairesRequest $request): AnonymousResourceCollection
    {
        $requete = $this->requeteDeBase()->with(['categories' => fn ($c) => $c->ouvertes()]);
        $secteurs = [];

        if ($q = $request->validated('q')) {
            // « plombier », « plomberie » ou « ma douche fuit » : le secteur reconnu prime sur le texte.
            $secteurs = $this->analyseur->analyser($q);

            if ($secteurs !== []) {
                $slugs = array_merge(...array_column($secteurs, 'categories'));
                $requete->whereHas('categories', fn (Builder $c) => $c->ouvertes()->whereIn('categories.slug', $slugs));
            } else {
                $this->rechercherLeTexte($requete, $q);
            }
        }

        // Une catégorie ou un département masqué ne renvoie personne, même si le prestataire
        // exerce aussi un métier ouvert.
        if ($categorie = $request->validated('categorie')) {
            $requete->whereHas('categories', fn (Builder $c) => $c->ouvertes()->where('slug', $categorie));
        }

        if ($departement = $request->validated('departement')) {
            $requete->whereHas('categories', fn (Builder $c) => $c->ouvertes()
                ->whereHas('rubrique.departement', fn (Builder $d) => $d->where('slug', $departement)));
        }

        if ($ville = $request->validated('ville')) {
            $requete->whereHas('quartier.ville', fn (Builder $v) => $v->where('slug', $ville));
        }

        if ($quartier = $request->validated('quartier')) {
            $requete->where('quartier_id', $quartier);
        }

        $tri = $request->validated('tri') ?? ($request->aPosition() ? 'distance' : 'pertinence');

        if ($request->aPosition()) {
            // Formule de haversine : distance à vol d'oiseau entre l'utilisateur et le prestataire.
            $distance = '('.self::RAYON_TERRE_KM.' * 2 * ASIN(SQRT('
                .'POWER(SIN(RADIANS(latitude - ?) / 2), 2) + '
                .'COS(RADIANS(?)) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ?) / 2), 2))))';
            $position = [(float) $request->validated('lat'), (float) $request->validated('lat'), (float) $request->validated('lng')];

            $requete->whereNotNull('latitude')
                ->select('prestataires.*')
                ->selectRaw("{$distance} AS distance_km", $position);

            if ($rayon = $request->validated('rayon_km')) {
                $requete->whereRaw("{$distance} <= ?", [...$position, (float) $rayon]);
            }
        } elseif ($tri === 'distance') {
            $tri = 'pertinence';
        }

        match ($tri) {
            'distance' => $requete->orderBy('distance_km'),
            'note' => $requete->orderByDesc('note_moyenne')->orderByDesc('nombre_avis'),
            'avis' => $requete->orderByDesc('nombre_avis'),
            'reponse' => $requete->orderByRaw('delai_reponse_minutes IS NULL')->orderBy('delai_reponse_minutes'),
            default => $requete->orderByDesc('en_vedette')->orderByDesc('note_moyenne')->orderByDesc('nombre_avis'),
        };

        return PrestataireResource::collection(
            $requete->orderBy('id')->paginate($request->validated('par_page') ?? 20)->withQueryString()
        )->additional([
            // Ce que la recherche a compris de la demande, pour l'annoncer au client.
            'analyse' => ['secteurs' => array_column($secteurs, 'nom')],
        ]);
    }

    /**
     * Aucun secteur reconnu : la phrase entière, ou l'un de ses mots porteurs de sens, doit
     * figurer dans le nom, le métier, la description ou une catégorie ouverte.
     */
    private function rechercherLeTexte(Builder $requete, string $q): void
    {
        $termes = collect(preg_split('/[\s\'’,.;:!?()-]+/u', $q, -1, PREG_SPLIT_NO_EMPTY))
            ->filter(fn (string $mot) => mb_strlen($mot) >= 4 && ! in_array(Str::lower(Str::ascii($mot)), self::MOTS_VIDES, true))
            ->prepend($q)
            ->unique();

        $requete->where(function (Builder $sous) use ($termes) {
            foreach ($termes as $terme) {
                $motif = '%'.addcslashes($terme, '%_\\').'%';
                $sous->orWhere('nom', 'like', $motif)
                    ->orWhere('metier', 'like', $motif)
                    ->orWhere('description', 'like', $motif)
                    ->orWhereHas('categories', fn (Builder $c) => $c->ouvertes()->where('nom', 'like', $motif));
            }
        });
    }

    /** GET /api/prestataires/vedettes — « Prestataires à la une » de l'accueil. */
    public function vedettes(): AnonymousResourceCollection
    {
        return PrestataireResource::collection(
            $this->requeteDeBase()->where('en_vedette', true)->orderByDesc('note_moyenne')->limit(6)->get()
        );
    }

    /** GET /api/prestataires/{prestataire} — fiche professionnelle. */
    public function show(Prestataire $prestataire): FicheProResource
    {
        abort_unless($prestataire->estVisible(), 404, 'Ce prestataire n\'est plus référencé.');

        $prestataire->load([
            'quartier.ville',
            'categories' => fn ($c) => $c->ouvertes(),
            'documents',
            'realisations',
            'avis' => fn ($avis) => $avis->with('auteur')->latest()->limit(3),
        ])->loadCount($this->comptesDocuments());

        return FicheProResource::make($prestataire);
    }

    private function requeteDeBase(): Builder
    {
        return Prestataire::query()->visibles()->with('quartier')->withCount($this->comptesDocuments());
    }

    private function comptesDocuments(): array
    {
        return Prestataire::comptesDocuments();
    }
}
