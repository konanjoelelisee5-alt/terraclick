<?php

namespace App\Console\Commands;

use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Charge les référentiels (catalogue, prestations, rôles et permissions) et, avec --demo, les
 * données de démonstration — seulement si les seeders ou les réglages qu'ils lisent ont changé
 * depuis le dernier chargement. Au démarrage du serveur en ligne, rejouer tout à chaque fois
 * prenait plusieurs minutes vers la base distante, pendant lesquelles l'API ne répondait pas.
 */
#[Signature('terraclick:amorcer {--demo : Charger aussi les prestataires et comptes de démonstration} {--force : Recharger même sans changement}')]
#[Description('Charge les référentiels (et la démonstration) quand ils ont changé')]
class Amorcer extends Command
{
    /** Ce que lisent les seeders : un changement ici impose un nouveau chargement. */
    private const SOURCES = ['database/seeders', 'config/acces.php', 'config/secteurs.php', 'config/mvp.php', 'config/pressing.php', 'config/candidature.php'];

    public function handle(): int
    {
        $demo = (bool) $this->option('demo');
        $empreinte = $this->empreinte();
        $dernier = DB::table('amorcages')->latest('id')->first();

        if (! $this->option('force') && $dernier && $dernier->empreinte === $empreinte && (bool) $dernier->demo === $demo) {
            $this->info('Référentiels déjà à jour : rien à charger.');

            return self::SUCCESS;
        }

        $debut = microtime(true);
        $this->call('db:seed', ['--force' => true]);
        if ($demo) {
            $this->call('db:seed', ['--class' => PrestataireSeeder::class, '--force' => true]);
            $this->call('db:seed', ['--class' => DemoSeeder::class, '--force' => true]);
        }
        DB::table('amorcages')->insert(['empreinte' => $empreinte, 'demo' => $demo, 'fait_le' => now()]);
        $this->info(sprintf('Référentiels chargés en %d s.', microtime(true) - $debut));

        return self::SUCCESS;
    }

    private function empreinte(): string
    {
        $fichiers = [];
        foreach (self::SOURCES as $source) {
            $chemin = base_path($source);
            $fichiers = [...$fichiers, ...(is_dir($chemin) ? glob($chemin.'/*.php') : [$chemin])];
        }
        sort($fichiers);

        return hash('sha256', implode('', array_map(fn (string $f) => basename($f).hash_file('sha256', $f), $fichiers)));
    }
}
