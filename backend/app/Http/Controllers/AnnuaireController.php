<?php

namespace App\Http\Controllers;

use App\Http\Resources\DepartementResource;
use App\Http\Resources\VilleResource;
use App\Models\Departement;
use App\Models\Secteur;
use App\Models\Ville;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/** Référentiels de l'annuaire : villes couvertes et arborescence des métiers. */
class AnnuaireController extends Controller
{
    /** GET /api/villes */
    public function villes(): AnonymousResourceCollection
    {
        // Seuls les quartiers ouverts par l'équipe sont proposés.
        return VilleResource::collection(Ville::with(['quartiers' => fn ($q) => $q->where('actif', true)])->orderBy('ordre')->get());
    }

    /**
     * GET /api/departements — le méga-menu en une requête. Seules les catégories ouvertes
     * (config/mvp.php) y figurent ; une rubrique ou un département vidé disparaît.
     */
    public function departements(): AnonymousResourceCollection
    {
        // Un prestataire classé dans plusieurs catégories d'un même département ne compte qu'une fois.
        $comptes = DB::table('categorie_prestataire')
            ->join('categories', 'categories.id', '=', 'categorie_prestataire.categorie_id')
            ->join('rubriques', 'rubriques.id', '=', 'categories.rubrique_id')
            ->join('prestataires', 'prestataires.id', '=', 'categorie_prestataire.prestataire_id')
            ->where('prestataires.actif', true)
            ->when(config('mvp.actif'), fn ($q) => $q->whereIn('categories.slug', Secteur::categoriesOuvertes()))
            ->groupBy('rubriques.departement_id')
            ->selectRaw('rubriques.departement_id, COUNT(DISTINCT categorie_prestataire.prestataire_id) AS total')
            ->pluck('total', 'departement_id');

        $departements = Departement::with(['rubriques.categories' => fn ($c) => $c->ouvertes()])->orderBy('ordre')->get()
            ->each(fn (Departement $departement) => $departement->setRelation(
                'rubriques',
                $departement->rubriques->filter(fn ($rubrique) => $rubrique->categories->isNotEmpty())->values(),
            ))
            ->filter(fn (Departement $departement) => $departement->rubriques->isNotEmpty())
            ->each(fn (Departement $departement) => $departement->nombre_prestataires = $comptes[$departement->id] ?? 0)
            ->values();

        return DepartementResource::collection($departements);
    }
}
