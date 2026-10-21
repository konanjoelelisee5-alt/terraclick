<?php

namespace App\Http\Controllers;

use App\Models\Avis;
use App\Models\Prestataire;
use App\Models\Realisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Fil d'actualité de l'accueil : ce qui se passe réellement sur la plateforme (nouveaux
 * techniciens, avis laissés, réalisations publiées), du plus récent au plus ancien. Seuls
 * les prestataires visibles (MVP) y figurent ; l'auteur d'un avis est abrégé (« Aya K. »).
 */
class ActualiteController extends Controller
{
    private const PAR_PAGE = 10;

    /** Nombre d'éléments lus par source : le fil reste court tant que la plateforme démarre. */
    private const PAR_SOURCE = 60;

    /** GET /api/actualites?page= */
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $fil = $this->nouveauxTechniciens()
            ->concat($this->avis())
            ->concat($this->realisations())
            ->sortByDesc('date')
            ->values();

        $tranche = $fil->slice(($page - 1) * self::PAR_PAGE, self::PAR_PAGE)->values();

        return response()->json([
            'data' => $tranche->map(fn (array $element) => [
                ...$element,
                'date' => $element['date']->toIso8601String(),
                'date_relative' => $element['date']->locale('fr')->diffForHumans(short: true),
            ]),
            'meta' => ['page' => $page, 'suivante' => $fil->count() > $page * self::PAR_PAGE ? $page + 1 : null],
        ]);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function nouveauxTechniciens(): Collection
    {
        return Prestataire::query()->visibles()->with(['quartier', 'categories' => fn ($c) => $c->ouvertes()])
            ->latest()->limit(self::PAR_SOURCE)->get()
            ->map(fn (Prestataire $pro) => $this->element('nouveau', $pro, $pro->created_at, [
                'titre' => "{$pro->nom} rejoint TerraClick",
                'texte' => $pro->metier.($pro->quartier ? " à {$pro->quartier->nom}" : '').'.',
            ]));
    }

    /** @return Collection<int, array<string, mixed>> */
    private function avis(): Collection
    {
        return Avis::query()->with(['auteur', 'prestataire.quartier', 'prestataire.categories' => fn ($c) => $c->ouvertes()])
            ->whereHas('prestataire', fn ($p) => $p->visibles())
            ->latest()->limit(self::PAR_SOURCE)->get()
            ->map(function (Avis $avis) {
                $mots = preg_split('/\s+/u', trim((string) $avis->auteur?->nom), -1, PREG_SPLIT_NO_EMPTY);
                $auteur = $mots ? $mots[0].(isset($mots[1]) ? ' '.mb_substr($mots[1], 0, 1).'.' : '') : 'Un client';
                $note = rtrim(rtrim(number_format((float) $avis->note, 1, ',', ''), '0'), ',');

                return $this->element('avis', $avis->prestataire, $avis->created_at, [
                    'id' => "avis-{$avis->id}",
                    'titre' => "{$auteur} a noté {$avis->prestataire->nom} {$note}/5",
                    'texte' => $avis->commentaire ? "« {$avis->commentaire} »" : null,
                    'note' => (float) $avis->note,
                ]);
            });
    }

    /** @return Collection<int, array<string, mixed>> */
    private function realisations(): Collection
    {
        return Realisation::query()->with(['prestataire.quartier', 'prestataire.categories' => fn ($c) => $c->ouvertes()])
            ->whereHas('prestataire', fn ($p) => $p->visibles())
            ->latest()->limit(self::PAR_SOURCE)->get()
            ->map(fn (Realisation $realisation) => $this->element('realisation', $realisation->prestataire, $realisation->created_at, [
                'id' => "realisation-{$realisation->id}",
                'titre' => $realisation->legende,
                'texte' => "Réalisation de {$realisation->prestataire->nom}.",
            ]));
    }

    /**
     * @param  array<string, mixed>  $contenu
     * @return array<string, mixed>
     */
    private function element(string $type, Prestataire $pro, ?Carbon $date, array $contenu): array
    {
        return [
            'id' => "{$type}-{$pro->id}",
            'type' => $type,
            'note' => null,
            ...$contenu,
            'date' => $date ?? now(),
            'prestataire' => [
                'id' => $pro->id,
                'nom' => $pro->nom,
                'metier' => $pro->metier,
                'initiales' => $pro->initiales(),
                'quartier' => $pro->quartier?->nom,
                // Catégorie ouverte principale : l'application en déduit le secteur et sa photo.
                'categorie' => $pro->categories->first()?->slug,
            ],
        ];
    }
}
