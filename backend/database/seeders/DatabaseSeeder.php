<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(CatalogueSeeder::class);

        // Contenu fictif : à ne pas charger en production.
        if (! app()->isProduction()) {
            $this->call([PrestataireSeeder::class, DemoSeeder::class]);
        }
    }
}
