<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| Les secteurs d'activité passent du code (config/secteurs.php) à la base : l'administrateur
| les crée, les modifie, les active et les classe depuis son tableau de bord. Les six secteurs
| d'aujourd'hui sont recopiés tels quels, avec l'icône et la photo de l'accueil client.
| Les sous-services (prestations) peuvent aussi être désactivés sans être supprimés.
*/
return new class extends Migration
{
    /** Ce que l'accueil client affichait jusqu'ici (frontend/src/data/catalogue.ts). */
    private const AFFICHAGE = [
        'plomberie' => ['Plombier', 'droplets'],
        'electricite' => ['Électricien', 'zap'],
        'climatisation' => ['Climaticien', 'snowflake'],
        'serrurerie' => ['Serrurier', 'key-round'],
        'menuiserie' => ['Menuisier', 'hammer'],
        'pressing' => ['Pressing', 'shirt'],
    ];

    public function up(): void
    {
        Schema::create('secteurs', function (Blueprint $table) {
            $table->id();
            $table->string('cle', 60)->unique();
            $table->string('nom', 80);
            $table->string('metier', 80)->nullable();
            $table->text('description')->nullable();
            $table->string('icone', 40)->default('wrench');
            $table->string('couleur', 7)->nullable();
            $table->boolean('actif')->default(false);
            $table->unsignedSmallInteger('ordre')->default(0);
            // Catégories de l'annuaire (slugs), problèmes proposés au client, vocabulaire de recherche.
            $table->json('categories');
            $table->json('problemes');
            $table->json('mots');
            $table->timestamps();
        });

        Schema::table('prestations', function (Blueprint $table) {
            $table->boolean('actif')->default(true)->after('unite');
        });

        $ordre = 0;
        foreach (config('secteurs') as $cle => $secteur) {
            [$metier, $icone] = self::AFFICHAGE[$cle] ?? [null, 'wrench'];
            DB::table('secteurs')->insert([
                'cle' => $cle,
                'nom' => $secteur['nom'],
                'metier' => $metier,
                'icone' => $icone,
                'actif' => true,
                'ordre' => ++$ordre,
                'categories' => json_encode($secteur['categories']),
                'problemes' => json_encode($secteur['problemes'] ?? []),
                'mots' => json_encode($secteur['mots']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('prestations', fn (Blueprint $table) => $table->dropColumn('actif'));
        Schema::dropIfExists('secteurs');
    }
};
