<?php

namespace Database\Seeders;

use App\Models\Prestataire;
use App\Models\Prestation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catalogue des prestations des cinq secteurs, puis rattachement de chaque technicien aux
 * prestations de ses secteurs. Les prix sont INDICATIFS (F CFA, main-d'œuvre, pièces en sus
 * sauf mention) : à valider avec les techniciens avant le lancement. Rejouable sans doublon.
 *
 * Mots-clés : même syntaxe que config/secteurs.php (« tuyau* » = préfixe, poids 3 = la
 * prestation elle-même, 2 = indice net, 1 = indice faible).
 */
class PrestationSeeder extends Seeder
{
    /** @var array<string, list<array{0: string, 1: array<string, int>, 2: ?int, 3: ?int, 4?: string}>> */
    private const CATALOGUE = [
        'plomberie' => [
            ['Réparation de fuite d\'eau', ['fuit*' => 3, 'fuyant*' => 3, 'goutte*' => 2, 'suinte*' => 2, 'inond*' => 1], 5000, 15000],
            ['Réparation de tuyau cassé', ['tuyau*' => 3, 'tuyauterie*' => 3, 'conduite*' => 2, 'pvc' => 2, 'canalisation cassee' => 3, 'casse*' => 1, 'perce*' => 1, 'eclate*' => 2], 7000, 20000],
            ['Débouchage WC et canalisation', ['debouch*' => 3, 'bouch*' => 3, 'wc' => 2, 'toilette*' => 2, 'canalisation*' => 2, 'egout*' => 2, 'evacuation*' => 2, 'odeur*' => 1], 8000, 25000],
            ['Remplacement de robinet', ['robinet*' => 3, 'mitigeur*' => 3, 'casse*' => 1], 5000, 12000],
            ['Chauffe-eau', ['chauffe eau' => 3, 'ballon d eau' => 3, 'cumulus' => 3, 'eau chaude' => 2], 15000, 45000],
            ['Pompe et surpresseur', ['pompe*' => 3, 'surpresseur*' => 3, 'pas d eau' => 2, 'pression' => 2, 'forage*' => 2], 15000, 50000],
            ['Installation sanitaire', ['installation sanitaire' => 3, 'douche*' => 2, 'lavabo*' => 2, 'baignoire*' => 2, 'evier*' => 2, 'salle de bain' => 2, 'installer' => 1], 20000, 80000],
        ],
        'electricite' => [
            ['Dépannage de panne de courant', ['panne de courant' => 3, 'pas de courant' => 3, 'plus de courant' => 3, 'coupure*' => 2, 'court circuit' => 3, 'noir' => 1], 5000, 15000],
            ['Disjoncteur qui saute', ['disjonct*' => 3, 'fusible*' => 3, 'saute*' => 2], 6000, 15000],
            ['Prise ou interrupteur', ['prise*' => 3, 'interrupteur*' => 3, 'etincel*' => 2], 3000, 8000, 'par point'],
            ['Éclairage et luminaires', ['ampoule*' => 3, 'lampe*' => 3, 'eclairage*' => 3, 'lumiere*' => 2, 'luminaire*' => 3, 'spot*' => 2, 'neon*' => 2], 3000, 10000, 'par point'],
            ['Tableau électrique', ['tableau electrique' => 3, 'tableau' => 2, 'compteur' => 1], 25000, 80000],
            ['Installation électrique', ['installation electrique' => 3, 'cablage*' => 3, 'cable*' => 2, 'fil' => 1, 'branchement*' => 2, 'maison neuve' => 2], 50000, 300000],
            ['Ventilateur et brasseur', ['ventilateur*' => 3, 'brasseur*' => 3], 5000, 12000],
        ],
        'climatisation' => [
            ['Entretien et nettoyage de clim', ['entretien*' => 3, 'nettoy*' => 3, 'filtre*' => 2, 'sent mauvais' => 1], 10000, 20000],
            ['Recharge de gaz', ['recharge*' => 3, 'gaz' => 2], 15000, 30000],
            ['Clim qui ne refroidit pas', ['refroidi*' => 3, 'froid*' => 2, 'fait chaud' => 2, 'chaud*' => 1], 10000, 35000],
            ['Clim qui coule', ['coule*' => 3, 'goutte*' => 2, 'fuit*' => 2], 8000, 20000],
            ['Installation de climatiseur', ['installation*' => 3, 'installer' => 3, 'pose*' => 2, 'split*' => 1, 'nouveau' => 1], 30000, 60000],
            ['Réparation de réfrigérateur', ['frigo*' => 3, 'refrigerateur*' => 3, 'congelateur*' => 3, 'chambre froide' => 2], 10000, 35000],
        ],
        'serrurerie' => [
            ['Ouverture de porte bloquée', ['bloque*' => 3, 'enferm*' => 3, 'ouvre pas' => 3, 'ouvre plus' => 3, 'claque*' => 2, 'coince*' => 2], 10000, 25000],
            ['Clé perdue ou double de clé', ['cle perdue' => 3, 'double*' => 3, 'reproduction*' => 3, 'cle' => 2, 'clef*' => 2, 'perdu*' => 2], 3000, 15000],
            ['Changement de serrure', ['changer' => 2, 'serrure cassee' => 3, 'barillet*' => 3, 'remplac*' => 2, 'ferme pas' => 2, 'ferme plus' => 2], 10000, 30000],
            ['Pose de verrou ou cadenas', ['verrou*' => 3, 'cadenas' => 3, 'loquet*' => 3], 5000, 15000],
            ['Blindage et sécurité', ['blind*' => 3, 'securi*' => 2, 'cambriol*' => 3, 'coffre fort' => 3], 50000, 250000],
            ['Portail et grille', ['portail*' => 3, 'grille*' => 3], 15000, 60000],
        ],
        'menuiserie' => [
            ['Réparation de porte ou fenêtre', ['fenetre*' => 3, 'charniere*' => 3, 'persienne*' => 3, 'volet*' => 3, 'porte' => 2, 'abime*' => 1], 8000, 25000],
            ['Réparation de meuble', ['repar*' => 2, 'meuble*' => 2, 'chaise*' => 3, 'tiroir*' => 3, 'table' => 2, 'casse*' => 1], 5000, 20000],
            ['Meuble sur mesure', ['sur mesure' => 3, 'fabrication' => 3, 'fabriquer' => 3, 'commande*' => 1], 50000, 400000],
            ['Placard et dressing', ['placard*' => 3, 'dressing*' => 3, 'armoire*' => 3, 'rangement*' => 2], 80000, 350000],
            ['Pose de porte ou fenêtre', ['pose*' => 3, 'poser' => 3, 'installer' => 2, 'neuve*' => 1], 25000, 90000],
            ['Lit et étagères', ['lit' => 3, 'etagere*' => 3, 'sommier*' => 3], 40000, 200000],
        ],
        'pressing' => [
            ['Lavage et repassage', ['lavage' => 2, 'laver' => 2, 'repass*' => 3, 'linge*' => 2, 'lessive*' => 2, 'chemise*' => 2, 'pantalon*' => 2], 300, 1500, 'par pièce'],
            ['Nettoyage à sec', ['nettoyage a sec' => 3, 'sec' => 2, 'delicat*' => 2, 'soie' => 2, 'laine' => 2], 1000, 3500, 'par pièce'],
            ['Costume et tenue de cérémonie', ['costume*' => 3, 'veste*' => 3, 'tenue*' => 2, 'ceremonie*' => 2, 'mariage*' => 2, 'smoking*' => 3], 2000, 6000, 'par pièce'],
            ['Bazin, pagne et boubou', ['bazin*' => 3, 'pagne*' => 3, 'boubou*' => 3, 'wax' => 2, 'amidon*' => 2], 1000, 4000, 'par pièce'],
            ['Draps, couettes et rideaux', ['drap*' => 3, 'couette*' => 3, 'rideau*' => 3, 'couverture*' => 3, 'nappe*' => 2], 1500, 6000, 'par pièce'],
            ['Détachage', ['tache*' => 3, 'detach*' => 3, 'encre' => 2, 'huile' => 1], 1000, 3000, 'par pièce'],
            ['Collecte et livraison à domicile', ['livraison' => 3, 'livrer' => 3, 'collecte*' => 3, 'a domicile' => 2, 'recuperer' => 2, 'ramasser' => 2], 500, 2000, 'par trajet'],
        ],
    ];

    /** Prix propres à certains techniciens de démonstration (sinon, le prix indicatif s'applique). */
    private const PRIX_PROPRES = [
        'Koffi Tanoh' => ['Réparation de tuyau cassé' => [6000, 15000], 'Réparation de fuite d\'eau' => [5000, 12000]],
        'Ali Diomandé' => ['Installation sanitaire' => [25000, 70000]],
    ];

    public function run(): void
    {
        foreach (self::CATALOGUE as $secteur => $prestations) {
            foreach ($prestations as $ordre => $ligne) {
                [$nom, $mots, $min, $max] = $ligne;
                Prestation::updateOrCreate(
                    ['slug' => Str::slug($nom)],
                    ['secteur' => $secteur, 'nom' => $nom, 'mots' => $mots, 'prix_min' => $min, 'prix_max' => $max, 'unite' => $ligne[4] ?? null, 'ordre' => $ordre],
                );
            }
        }

        // Chaque technicien propose les prestations des secteurs de ses catégories.
        $parSecteur = Prestation::all()->groupBy('secteur');
        Prestataire::with('categories')->get()->each(function (Prestataire $pro) use ($parSecteur) {
            $slugs = $pro->categories->pluck('slug')->all();
            foreach (config('secteurs') as $cle => $secteur) {
                if (array_intersect($slugs, $secteur['categories']) === []) {
                    continue;
                }
                foreach ($parSecteur[$cle] ?? [] as $prestation) {
                    [$min, $max] = self::PRIX_PROPRES[$pro->nom][$prestation->nom] ?? [null, null];
                    $pro->offres()->syncWithoutDetaching([$prestation->id => ['prix_min' => $min, 'prix_max' => $max]]);
                }
            }
        });
    }
}
