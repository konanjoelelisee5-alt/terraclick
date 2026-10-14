<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Arborescence de l'annuaire : département > rubrique > catégorie.
     * Exemple : Maison & Bâtiment > Construction > Plombiers.
     */
    public function up(): void
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('slug')->unique();
            // Nom d'icône Lucide, utilisé tel quel par le frontend.
            $table->string('icone', 50);
            $table->string('apercu')->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('rubriques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departement_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('slug');
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();

            $table->unique(['departement_id', 'slug']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rubrique_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            // Unique globalement : sert de filtre dans l'URL de recherche.
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
        Schema::dropIfExists('rubriques');
        Schema::dropIfExists('departements');
    }
};
