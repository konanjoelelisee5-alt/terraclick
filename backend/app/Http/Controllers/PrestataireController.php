<?php

namespace App\Http\Controllers;

use App\Http\Requests\Annuaire\RechercherPrestatairesRequest;
use App\Http\Resources\FicheProResource;
use App\Http\Resources\PrestataireResource;
use App\Models\Prestataire;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PrestataireController extends Controller
{
    /** Rayon moyen de la Terre, pour le calcul de distance. */
    private const RAYON_TERRE_KM = 6371;

    /** GET /api/prestataires — recherche, filtres, « Autour de moi ». */
    public function index(RechercherPrestatairesRequest $request): AnonymousResourceCollection
    {
        $requete = $this->requeteDeBase()->with('categories');

        if ($q = $request->validated('q')) {
            $motif = '%'.addcslashes($q, '%_\\').'%';
            $requete->where(fn (Builder $sous) => $sous
                ->where('nom', 'like', $motif)
                ->orWhere('metier', 'like', $motif)
                ->orWhere('description', 'like', $motif)
                ->orWhereHas('categories', fn (Builder $c) => $c->where('nom', 'like', $motif)));
        }

        if ($categorie = $request->validated('categorie')) {
            $requete->whereHas('categories', fn (Builder $c) => $c->where('slug', $categorie));
        }

        if ($departement = $request->validated('departement')) {
            $requete->whereHas('categories.rubrique.departement', fn (Builder $d) => $d->where('slug', $departement));
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
        );
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
        abort_unless($prestataire->actif, 404, 'Ce prestataire n\'est plus référencé.');

        $prestataire->load([
            'quartier.ville',
            'categories',
            'documents',
            'realisations',
            'avis' => fn ($avis) => $avis->with('auteur')->latest()->limit(3),
        ])->loadCount($this->comptesDocuments());

        return FicheProResource::make($prestataire);
    }

    private function requeteDeBase(): Builder
    {
        return Prestataire::query()->actifs()->with('quartier')->withCount($this->comptesDocuments());
    }

    private function comptesDocuments(): array
    {
        return [
            'documents',
            'documents as documents_verifies_count' => fn (Builder $d) => $d->where('statut', 'verifie'),
        ];
    }
}
