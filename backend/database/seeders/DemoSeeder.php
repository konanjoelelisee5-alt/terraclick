<?php

namespace Database\Seeders;

use App\Models\Accord;
use App\Models\Avis;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

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

        // Compte du gérant de démonstration, relié à Pressing Éclat : il reçoit les commandes.
        $gerant = User::updateOrCreate(
            ['telephone' => '+2250708080808'],
            ['nom' => 'Gérant Pressing Éclat', 'ville_id' => $habitat->ville_id, 'quartier_id' => $habitat->id, 'telephone_verifie_le' => now()],
        );
        Prestataire::where('nom', 'Pressing Éclat')->whereNull('user_id')->update(['user_id' => $gerant->id]);

        // Mot de passe de démonstration, posé une seule fois : un changement fait depuis
        // l'application n'est pas écrasé au déploiement suivant.
        foreach ([$aya, $moussa, $koffi, $gerant] as $compte) {
            if (! $compte->aUnMotDePasse()) {
                $compte->forceFill(['password' => self::MOT_DE_PASSE_DEMO])->save();
            }
        }

        $this->demandesDeDemonstration($aya, $koffi);

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

    /**
     * Demandes d'Aya à chaque étape du cycle, pour que « Mes demandes » et le suivi montrent de
     * vraies données. Posées une seule fois : celles que le compte crée ensuite s'y ajoutent.
     */
    private function demandesDeDemonstration(User $aya, User $koffi): void
    {
        if (Demande::where('user_id', $aya->id)->exists()) {
            return;
        }

        $scenarios = [
            // [technicien, secteur, problème, jours écoulés, statuts franchis (statut => [auteur, message]), estimation, créneau]
            ['Koffi Tanoh', 'plomberie', 'Fuite d\'eau', 6, [
                'acceptee' => ['technicien', 'Je peux passer mardi matin. Le joint et le siphon sont à changer.'],
                'en_cours' => ['technicien', null],
                'terminee' => ['technicien', 'Joint et siphon remplacés, plus de fuite.'],
            ], 25000, 'Mardi, 9 h'],
            ['Élec Yakro', 'electricite', 'Disjoncteur qui saute', 4, [
                'acceptee' => ['technicien', 'Je viens vérifier le tableau électrique demain après-midi.'],
            ], 18000, 'Demain, 15 h'],
            ['ClimaCool CI', 'climatisation', 'Entretien ou recharge de gaz', 12, [
                'acceptee' => ['technicien', 'Recharge et nettoyage des filtres.'],
                'en_cours' => ['technicien', null],
                'terminee' => ['technicien', null],
                'confirmee' => ['client', null],
            ], 12000, 'Samedi, 10 h'],
            ['Serrurerie N\'Guessan', 'serrurerie', 'Changer une serrure', 1, [], null, null],
            ['Ali Diomandé', 'plomberie', 'WC bouché', 15, [
                'annulee' => ['client', 'Problème réglé entre-temps.'],
            ], null, null],
        ];

        foreach ($scenarios as [$nom, $secteur, $probleme, $jours, $etapes, $estimation, $creneau]) {
            $pro = Prestataire::where('nom', $nom)->first();
            if (! $pro) {
                continue;
            }

            $date = now()->subDays($jours)->setTime(9, 0);
            $this->travelTo($date);
            $demande = Demande::create([
                'user_id' => $aya->id,
                'secteur' => $secteur,
                'probleme' => $probleme,
                'quartier_id' => $pro->quartier_id ?? $aya->quartier_id,
                'quand' => 'aujourdhui',
                'mode' => 'choisi',
                'prestataire_id' => $pro->id,
                'paiement' => 'especes',
                'estimation' => $estimation,
                'creneau' => $creneau,
                'statut' => array_key_last($etapes) ?? 'envoyee',
            ]);
            // Lancé depuis DatabaseSeeder, les événements de modèle sont coupés (WithoutModelEvents) :
            // la référence et la première étape sont alors posées ici.
            if ($demande->reference === null) {
                $demande->forceFill(['reference' => sprintf('DEM-%s-%05d', $demande->created_at->format('Y'), $demande->id)])->saveQuietly();
                $demande->evenements()->create(['user_id' => $aya->id, 'auteur' => 'client', 'statut' => 'envoyee']);
            }

            foreach ($etapes as $statut => [$auteur, $message]) {
                $date = $date->copy()->addHours(5);
                $this->travelTo($date);
                $demande->evenements()->create([
                    'user_id' => $auteur === 'client' ? $aya->id : ($nom === 'Koffi Tanoh' ? $koffi->id : null),
                    'auteur' => $auteur,
                    'statut' => $statut,
                    'message' => $message,
                ]);
            }
            // Chaque demande a son onglet, comme celles envoyées depuis l'application.
            Accord::pourDemande($demande->refresh());
        }

        $this->travelTo(null);
    }

    /** Date courante simulée, pour dater les demandes et leurs étapes dans le passé. */
    private function travelTo(?\DateTimeInterface $date): void
    {
        Carbon::setTestNow($date);
    }
}
