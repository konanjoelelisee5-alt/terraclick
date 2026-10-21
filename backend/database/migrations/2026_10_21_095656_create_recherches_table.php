<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Historique des recherches. « Supprimer les données de navigation » ne fait que masquer
        // une recherche pour son auteur (efface_le) : elle reste visible de l'administration.
        Schema::create('recherches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Identifiant aléatoire de l'appareil, gardé par l'application : « Onglets récents ».
            $table->string('appareil_id', 64)->nullable()->index();
            $table->string('appareil', 100)->nullable();
            $table->string('texte');
            $table->string('categorie')->nullable();
            $table->string('secteur', 40)->nullable();
            $table->string('ville', 60)->nullable();
            $table->timestamp('efface_le')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'efface_le']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recherches');
    }
};
