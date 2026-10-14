<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestataires', function (Blueprint $table) {
            $table->id();
            // Compte qui gère la fiche ; vide tant que le côté prestataire n'existe pas.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('quartier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom');
            $table->string('metier');
            $table->text('description')->nullable();
            $table->string('zone_intervention')->nullable();
            $table->string('telephone', 20)->nullable();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();

            // Fourchette indicative en F CFA ; sans maximum, s'affiche « À partir de ».
            $table->unsignedInteger('prix_min')->nullable();
            $table->unsignedInteger('prix_max')->nullable();
            $table->unsignedSmallInteger('delai_reponse_minutes')->nullable();
            $table->unsignedSmallInteger('annee_debut')->nullable();

            // Listes affichées sur la fiche, sans logique métier propre.
            $table->json('prestations')->nullable();
            $table->json('tarifs')->nullable();
            $table->json('horaires')->nullable();
            $table->json('garanties')->nullable();

            // Agrégats tenus à jour à chaque nouvel avis.
            $table->decimal('note_moyenne', 2, 1)->default(0);
            $table->unsignedInteger('nombre_avis')->default(0);

            $table->boolean('accepte_suivi')->default(false);
            $table->boolean('en_vedette')->default(false);
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->index(['actif', 'note_moyenne']);
        });

        Schema::create('categorie_prestataire', function (Blueprint $table) {
            $table->foreignId('categorie_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->primary(['categorie_id', 'prestataire_id']);
        });

        Schema::create('documents_prestataire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->enum('statut', ['en_attente', 'verifie', 'refuse'])->default('en_attente');
            $table->string('fichier')->nullable();
            $table->timestamp('verifie_le')->nullable();
            $table->timestamps();

            $table->unique(['prestataire_id', 'type']);
        });

        Schema::create('realisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->string('legende');
            $table->string('image')->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisations');
        Schema::dropIfExists('documents_prestataire');
        Schema::dropIfExists('categorie_prestataire');
        Schema::dropIfExists('prestataires');
    }
};
