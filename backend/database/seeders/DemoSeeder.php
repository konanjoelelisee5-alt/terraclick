<?php

namespace Database\Seeders;

use App\Models\Avis;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Comptes et avis de démonstration. Le numéro 07 58 42 19 03 est celui que le
 * frontend présente comme « déjà inscrit » : il se connecte sans étape de profil.
 */
class DemoSeeder extends Seeder
{
    public const MOT_DE_PASSE_DEMO = 'terraclick2026';

    public function run(): void
    {
        $habitat = Quartier::where('slug', 'habitat')->first();

        $aya = User::updateOrCreate(
            ['telephone' => '+2250758421903'],
            ['nom' => 'Aya Konan', 'ville_id' => $habitat->ville_id, 'quartier_id' => $habitat->id, 'telephone_verifie_le' => now()],
        );
        $moussa = User::updateOrCreate(
            ['telephone' => '+2250102030405'],
            ['nom' => 'Moussa Touré', 'telephone_verifie_le' => now()],
        );

        // Compte technicien de démonstration, relié à la fiche de Koffi Tanoh (espace pro).
        $koffi = User::updateOrCreate(
            ['telephone' => '+2250707070707'],
            ['nom' => 'Koffi Tanoh', 'ville_id' => $habitat->ville_id, 'quartier_id' => $habitat->id, 'telephone_verifie_le' => now()],
        );
        Prestataire::where('nom', 'Koffi Tanoh')->whereNull('user_id')->update(['user_id' => $koffi->id]);

        // Mot de passe de démonstration, posé une seule fois : un changement fait depuis
        // l'application n'est pas écrasé au déploiement suivant.
        foreach ([$aya, $moussa, $koffi] as $compte) {
            if (! $compte->aUnMotDePasse()) {
                $compte->forceFill(['password' => self::MOT_DE_PASSE_DEMO])->save();
            }
        }

        // Avis affichés sur la fiche de l'Ent. Bakayoko. Ils ne modifient pas ses agrégats
        // (4,8 sur 34 avis), qui représentent l'historique antérieur à la plateforme.
        $bakayoko = Prestataire::where('nom', 'Ent. Bakayoko')->firstOrFail();

        $avis = [
            [$aya, 5, 5, 5, 'Chantier livré avec deux semaines d\'avance. Les rapports hebdomadaires étaient précis.', '2026-07-12'],
            [$moussa, 4, 4, 4, 'Bon travail sur le gros œuvre. Quelques retards sur la livraison du carrelage.', '2026-03-20'],
        ];

        foreach ($avis as [$auteur, $ponctualite, $qualite, $prix, $commentaire, $date]) {
            $ligne = Avis::updateOrCreate(
                ['prestataire_id' => $bakayoko->id, 'user_id' => $auteur->id],
                [
                    'note_ponctualite' => $ponctualite,
                    'note_qualite' => $qualite,
                    'note_prix' => $prix,
                    'note' => round(($ponctualite + $qualite + $prix) / 3, 1),
                    'commentaire' => $commentaire,
                ],
            );
            $ligne->forceFill(['created_at' => $date, 'updated_at' => $date])->save();
        }
    }
}
