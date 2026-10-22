<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/** Au démarrage du serveur en ligne : la base répond-elle ? Sinon, l'erreur en clair dans les journaux. */
#[Signature('terraclick:base')]
#[Description('Vérifie que la base de données répond')]
class VerifierBase extends Command
{
    public function handle(): int
    {
        try {
            DB::select('SELECT 1');
            $this->info('Base de données : connectée.');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('ERREUR : la base MySQL ne répond pas. Vérifiez qu\'elle est allumée chez Aiven (« Running ») et les variables DB_* de Render.');
            $this->line($e->getMessage());

            return self::FAILURE;
        }
    }
}
