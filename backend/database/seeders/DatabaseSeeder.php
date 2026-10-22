<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Référentiels : catalogue de l'annuaire, prestations des secteurs (prix indicatifs),
        // rôles et permissions de chaque interface.
        $this->call([CatalogueSeeder::class, PrestationSeeder::class, RolesPermissionsSeeder::class]);

        // Contenu fictif : à ne pas charger en production.
        if (! app()->isProduction()) {
            $this->call([PrestataireSeeder::class, DemoSeeder::class]);
        }
    }
}
