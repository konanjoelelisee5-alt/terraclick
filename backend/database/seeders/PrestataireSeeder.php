<?php

namespace Database\Seeders;

use App\Models\Categorie;
use App\Models\Prestataire;
use App\Models\Quartier;
use Illuminate\Database\Seeder;

/**
 * Prestataires de démonstration repris de frontend/src/data/catalogue.ts et fiche.ts.
 * Les positions sont fictives : placées autour du centre de Yakro, elles servent
 * seulement à faire fonctionner « Autour de moi ».
 */
class PrestataireSeeder extends Seeder
{
    private const PRESTATAIRES = [
        [
            'nom' => 'Koffi Tanoh', 'metier' => 'Plombier', 'quartier' => 'habitat',
            'description' => 'Fuites, chauffe-eau, installation sanitaire. Déplacement dans tout Yakro.',
            'note_moyenne' => 4.8, 'nombre_avis' => 63, 'prix_min' => 5000, 'prix_max' => 15000,
            'delai_reponse_minutes' => 10, 'latitude' => 6.8350, 'longitude' => -5.2810,
            'categories' => ['plombiers', 'entretien-plomberie'],
        ],
        [
            'nom' => 'Ali Diomandé', 'metier' => 'Plombier · Carreleur', 'quartier' => 'assabou',
            'description' => 'Salle de bain complète, carrelage et raccordement. Travail garanti 6 mois.',
            'note_moyenne' => 4.5, 'nombre_avis' => 21, 'prix_min' => 8000, 'prix_max' => 20000,
            'delai_reponse_minutes' => 60, 'latitude' => 6.8080, 'longitude' => -5.2700,
            'categories' => ['plombiers', 'carreleurs'],
        ],
        [
            'nom' => 'Garage Bamba', 'metier' => 'Mécanicien auto', 'quartier' => 'kokrenou',
            'description' => 'Diagnostic, vidange, embrayage. Spécialiste Toyota et Hyundai.',
            'note_moyenne' => 4.6, 'nombre_avis' => 148, 'prix_min' => 10000, 'prix_max' => 60000,
            'delai_reponse_minutes' => 30, 'latitude' => 6.8440, 'longitude' => -5.2950,
            'categories' => ['mecanicien-auto'],
        ],
        [
            'nom' => 'Élec Yakro', 'metier' => 'Électricien', 'quartier' => 'millionnaire',
            'description' => 'Installation, tableau, dépannage de nuit. Devis sur place gratuit.',
            'note_moyenne' => 4.9, 'nombre_avis' => 37, 'prix_min' => 6000, 'prix_max' => 25000,
            'delai_reponse_minutes' => 20, 'latitude' => 6.8180, 'longitude' => -5.3050,
            'categories' => ['electriciens', 'entretien-electricite'],
        ],
        [
            'nom' => 'Solar Mamadou', 'metier' => 'Panneaux solaires', 'quartier' => 'dioulakro',
            'description' => 'Kits solaires maison et boutique, onduleurs, batteries. Pose et suivi.',
            'note_moyenne' => 4.7, 'nombre_avis' => 52, 'prix_min' => 150000, 'prix_max' => null,
            'delai_reponse_minutes' => 120, 'latitude' => 6.8550, 'longitude' => -5.2650,
            'categories' => ['panneaux-solaires', 'onduleur'],
        ],
        [
            'nom' => 'Auto Service Yakro', 'metier' => 'Mécanicien auto', 'quartier' => 'kokrenou',
            'description' => 'Entretien, diagnostic électronique et réparation toutes marques.',
            'note_moyenne' => 4.8, 'nombre_avis' => 126, 'delai_reponse_minutes' => 15,
            'latitude' => 6.8460, 'longitude' => -5.2980, 'en_vedette' => true,
            'categories' => ['mecanicien-auto', 'electricien-auto'],
        ],
        [
            'nom' => 'ClimaCool CI', 'metier' => 'Réparation climatisation', 'quartier' => 'habitat',
            'description' => 'Vente, pose, recharge et réparation de climatiseurs. Intervention rapide.',
            'note_moyenne' => 4.9, 'nombre_avis' => 89,
            'latitude' => 6.8330, 'longitude' => -5.2840, 'en_vedette' => true,
            'categories' => ['climatisation-vente-et-reparation'],
        ],
        [
            'nom' => 'Serrurerie N\'Guessan', 'metier' => 'Serrurier', 'quartier' => 'centre-ville',
            'description' => 'Ouverture de porte, changement de serrure, blindage et grilles de sécurité. Dépannage 24/24.',
            'note_moyenne' => 4.7, 'nombre_avis' => 41, 'prix_min' => 5000, 'prix_max' => 40000,
            'delai_reponse_minutes' => 15, 'latitude' => 6.8210, 'longitude' => -5.2760, 'en_vedette' => true,
            'categories' => ['serruriers'],
        ],
        [
            'nom' => 'Menuiserie Konaté', 'metier' => 'Menuisier', 'quartier' => 'morofe',
            'description' => 'Portes, fenêtres, placards et meubles sur mesure en bois massif. Pose et réparation.',
            'note_moyenne' => 4.6, 'nombre_avis' => 28, 'prix_min' => 15000, 'prix_max' => 250000,
            'delai_reponse_minutes' => 60, 'latitude' => 6.8120, 'longitude' => -5.2880, 'en_vedette' => true,
            'categories' => ['menuisiers'],
        ],
        [
            'nom' => 'Soleil Énergie', 'metier' => 'Panneaux solaires', 'quartier' => 'assabou',
            'description' => 'Études et installations solaires pour particuliers et commerces. Devis gratuit.',
            'note_moyenne' => 4.7, 'nombre_avis' => 74,
            'latitude' => 6.8060, 'longitude' => -5.2730, 'en_vedette' => true,
            'categories' => ['panneaux-solaires'],
        ],
        [
            'nom' => 'Ent. Bakayoko', 'metier' => 'Entreprise de construction · gros œuvre et finitions',
            'quartier' => 'centre-ville',
            'description' => 'Construction neuve, rénovation lourde et coordination des corps de métier à Yamoussoukro et alentours.',
            'zone_intervention' => 'Yamoussoukro, Toumodi et Attiégouakro',
            'note_moyenne' => 4.8, 'nombre_avis' => 34, 'annee_debut' => 2011, 'delai_reponse_minutes' => 120,
            'latitude' => 6.8200, 'longitude' => -5.2770, 'accepte_suivi' => true,
            'categories' => ['entreprises-de-construction', 'macons', 'carreleurs', 'peintres'],
            'prestations' => [
                'Construction neuve clé en main',
                'Gros œuvre et fondations',
                'Rénovation lourde',
                'Extension et surélévation',
                'Carrelage et peinture',
                'Coordination des corps de métier',
            ],
            'tarifs' => [
                ['libelle' => 'Étude et devis', 'montant' => 0],
                ['libelle' => 'Gros œuvre au m²', 'montant' => 95000, 'a_partir_de' => true],
                ['libelle' => 'Construction clé en main au m²', 'montant' => 210000, 'a_partir_de' => true],
            ],
            'horaires' => [
                ['jours' => 'Lundi – vendredi', 'ouverture' => '07:30', 'fermeture' => '18:00'],
                ['jours' => 'Samedi', 'ouverture' => '08:00', 'fermeture' => '13:00'],
                ['jours' => 'Dimanche', 'ouverture' => null, 'fermeture' => null],
            ],
            'garanties' => ['Garantie décennale', 'Parfait achèvement 1 an', 'Assurance responsabilité civile'],
            'documents' => ['registre_commerce', 'attestation_fiscale', 'assurance_decennale', 'cni_gerant'],
            'realisations' => [
                'Villa R+1 · Habitat, 2025',
                'Duplex · Kokrenou, 2024',
                'Immeuble R+2 · Assabou, 2024',
                'Rénovation · Dioulakro, 2023',
            ],
        ],
    ];

    public function run(): void
    {
        $quartiers = Quartier::whereHas('ville', fn ($v) => $v->where('slug', 'yamoussoukro'))->pluck('id', 'slug');

        foreach (self::PRESTATAIRES as $donnees) {
            $categories = $donnees['categories'];
            $documents = $donnees['documents'] ?? [];
            $realisations = $donnees['realisations'] ?? [];
            $quartier = $donnees['quartier'];
            unset($donnees['categories'], $donnees['documents'], $donnees['realisations'], $donnees['quartier']);

            $prestataire = Prestataire::updateOrCreate(
                ['nom' => $donnees['nom']],
                [...$donnees, 'quartier_id' => $quartiers[$quartier]],
            );

            $prestataire->categories()->sync(Categorie::whereIn('slug', $categories)->pluck('id'));

            foreach ($documents as $type) {
                $prestataire->documents()->updateOrCreate(['type' => $type], ['statut' => 'verifie', 'verifie_le' => now()]);
            }

            foreach ($realisations as $ordre => $legende) {
                $prestataire->realisations()->updateOrCreate(['legende' => $legende], ['ordre' => $ordre]);
            }
        }
    }
}
