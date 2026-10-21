<?php

namespace Database\Seeders;

use App\Models\Categorie;
use App\Models\Departement;
use App\Models\Quartier;
use App\Models\Rubrique;
use App\Models\Ville;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Référentiels de l'annuaire, repris de frontend/src/data/catalogue.ts.
 * Rejouable : les lignes existantes sont mises à jour, pas dupliquées.
 */
class CatalogueSeeder extends Seeder
{
    private const VILLES = [
        ['Yamoussoukro', 6.827623, -5.289343],
        ['Abidjan', 5.359952, -4.008256],
        ['Bouaké', 7.693997, -5.030312],
        ['Daloa', 6.877369, -6.450218],
    ];

    private const QUARTIERS_YAKRO = [
        'Habitat', 'Kokrenou', 'Millionnaire', 'Dioulakro', 'N\'Zuessy',
        'Morofe', 'Assabou', 'Centre-ville', 'Kpangbassou',
    ];

    /** [nom, icône Lucide, aperçu, [rubrique => [catégories]]] */
    private const DEPARTEMENTS = [
        ['Maison & Bâtiment', 'home', 'Immobilier, plombier, électricien, menuisier', [
            'Immobilier' => ['Maisons à louer', 'Appartements à vendre', 'Terrains', 'Magasins à louer', 'Agences immobilières', 'Notaires'],
            'Construction' => ['Entreprises de construction', 'Architectes & bureaux d\'études', 'Quincailleries & matériaux', 'Cimenteries', 'Maçons', 'Menuisiers', 'Serruriers', 'Vitriers', 'Carreleurs', 'Peintres', 'Plombiers', 'Électriciens'],
            'Équipement maison' => ['Climatisation : vente et réparation', 'Panneaux solaires', 'Groupes électrogènes', 'Sécurité et vidéosurveillance', 'Meubles', 'Décoration'],
            'Entretien' => ['Femmes de ménage', 'Jardiniers', 'Piscinistes', 'Désinsectisation', 'Entretien plomberie', 'Entretien électricité', 'Nettoyage de façades et toitures', 'Pressing'],
        ]],
        ['Auto & Transport', 'car', 'Mécano, tôlier, taxi, pièces détachées', [
            'Mécanique' => ['Mécanicien auto', 'Électricien auto', 'Tôlier', 'Peintre auto', 'Vulcanisateur', 'Lavage auto'],
            'Pièces détachées' => ['Pièces Toyota', 'Pièces Hyundai', 'Pièces moto'],
            'Transport' => ['Taxi', 'VTC', 'Camion de déménagement', 'Location de voiture', 'Auto-école'],
            'Carburant' => ['Stations-service', 'Vente de batteries'],
        ]],
        ['Alimentation & Marché', 'shopping-basket', 'Marchés, supermarchés, maquis, livraison', [
            'Supermarchés' => ['Carrefour', 'CDCI', 'Prosuma', 'Casino'],
            'Marchés' => ['Tomate', 'Poisson', 'Viande', 'Igname'],
            'Restaurants & maquis' => ['Maquis', 'Restaurant', 'Fast-food', 'Pâtisserie', 'Traiteur'],
            'Livraison' => ['Livreur de plat', 'Glacière'],
        ]],
        ['Éducation & Services', 'graduation-cap', 'Cyber, dossiers CNI, cours à domicile', [
            'Cours' => ['Prof à domicile Bac', 'Anglais', 'Informatique', 'Auto-école'],
            'Administratif' => ['Cyber', 'Photocopie', 'Dossier CNI', 'Extrait de naissance', 'Casier judiciaire', 'CMU'],
            'Formation' => ['Centres de formation', 'Écoles privées'],
        ]],
        ['Santé & Bien-être', 'heart-pulse', 'Clinique, pharmacie, coiffure, spa', [
            'Santé' => ['Cliniques', 'Pharmacies de garde', 'Laboratoire', 'Dentiste', 'Kiné'],
            'Beauté' => ['Salon de coiffure', 'Barber', 'Esthéticienne', 'Spa', 'Vente de perruques'],
        ]],
        ['Hôtellerie & Tourisme', 'bed-double', 'Hôtels, appart-meublés, salle de fête', [
            'Hébergement' => ['Hôtels', 'Auberges', 'Appart-meublé', 'Résidence'],
            'Loisirs' => ['Salle de fête', 'Plage', 'Parc', 'Agence de voyage'],
        ]],
        ['Entreprise & Pro', 'briefcase', 'Imprimerie, comptable, DJ, photographe', [
            'Services aux entreprises' => ['Imprimerie', 'Graphiste', 'Vidéaste', 'Community manager', 'Comptable', 'Avocat'],
            'Bureautique' => ['Fournitures de bureau', 'Impression bâche', 'Signalétique'],
            'Événementiel' => ['DJ', 'Décorateur', 'Location de chaises', 'Photographe', 'Sonorisation'],
        ]],
        ['Technologie & Énergie', 'cpu', 'PC, caméras, solaire, électroménager', [
            'Informatique' => ['Réparateur PC', 'Vente PC / téléphone', 'Cybercafé', 'Installation réseau', 'Installation caméra'],
            'Énergie' => ['Panneaux solaires', 'Onduleur', 'Électricien'],
            'Électroménager' => ['Réparation frigo', 'Réparation TV', 'Machine à laver'],
        ]],
        ['Mode & Commerce', 'shirt', 'Couturier, friperie, tissus, chaussures', [
            'Vêtements' => ['Friperie', 'Couturier', 'Vente de tissus', 'Chaussures'],
            'Boutiques en ligne' => ['Téléphone', 'Parfum', 'Accessoires'],
        ]],
        ['Finance & Assurance', 'landmark', 'Banques, Wave, Orange Money, assurance', [
            'Banque' => ['SIB', 'BICICI', 'SGBCI'],
            'Mobile money' => ['Points Wave', 'Orange Money', 'MTN Money'],
            'Assurance' => ['Assurance auto', 'Assurance habitation'],
        ]],
        ['Religion & Association', 'users', 'Églises, mosquées, ONG, syndicats', [
            'Lieux de culte' => ['Églises', 'Mosquées'],
            'Associations' => ['ONG', 'Syndicats'],
        ]],
        ['Administration', 'building-2', 'Mairie, préfecture, commissariat, hôpital', [
            'Administration' => ['Mairie', 'Commissariat', 'Hôpital', 'Préfecture'],
            'Urgence' => ['Sapeurs-pompiers', 'Gendarmerie', 'Dépannage 24/24'],
        ]],
    ];

    public function run(): void
    {
        foreach (self::VILLES as $ordre => [$nom, $latitude, $longitude]) {
            Ville::updateOrCreate(['slug' => Str::slug($nom)], compact('nom', 'latitude', 'longitude', 'ordre'));
        }

        $yakro = Ville::where('slug', 'yamoussoukro')->firstOrFail();
        foreach (self::QUARTIERS_YAKRO as $ordre => $nom) {
            Quartier::updateOrCreate(['ville_id' => $yakro->id, 'slug' => Str::slug($nom)], compact('nom', 'ordre'));
        }

        foreach (self::DEPARTEMENTS as $ordreDep => [$nom, $icone, $apercu, $rubriques]) {
            $departement = Departement::updateOrCreate(
                ['slug' => Str::slug($nom)],
                ['nom' => $nom, 'icone' => $icone, 'apercu' => $apercu, 'ordre' => $ordreDep],
            );

            foreach (array_keys($rubriques) as $ordreRub => $nomRubrique) {
                $rubrique = Rubrique::updateOrCreate(
                    ['departement_id' => $departement->id, 'slug' => Str::slug($nomRubrique)],
                    ['nom' => $nomRubrique, 'ordre' => $ordreRub],
                );

                foreach ($rubriques[$nomRubrique] as $ordreCat => $nomCategorie) {
                    Categorie::updateOrCreate(
                        ['slug' => $this->slugCategorie($nomCategorie, $rubrique)],
                        ['rubrique_id' => $rubrique->id, 'nom' => $nomCategorie, 'ordre' => $ordreCat],
                    );
                }
            }
        }
    }

    /**
     * Le slug d'une catégorie est unique dans tout l'annuaire. Une même catégorie peut
     * figurer dans deux rubriques (« Auto-école », « Panneaux solaires ») : la seconde
     * reçoit le nom de sa rubrique en suffixe.
     */
    private function slugCategorie(string $nom, Rubrique $rubrique): string
    {
        $slug = Str::slug($nom);
        $existante = Categorie::where('slug', $slug)->first();

        return ! $existante || $existante->rubrique_id === $rubrique->id ? $slug : $slug.'-'.$rubrique->slug;
    }
}
