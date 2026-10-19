<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Demande d'intervention d'un client, issue de l'assistant de besoin.
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            // DEM-2026-00001, posée juste après l'insertion.
            $table->string('reference', 20)->nullable()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Le besoin : secteur (clé de config/secteurs.php), problème type ou « Autre ».
            $table->string('secteur', 30);
            $table->string('probleme', 80);
            $table->text('precision')->nullable();

            // Où : quartier, puis adresse ou point de repère.
            $table->foreignId('quartier_id')->constrained()->restrictOnDelete();
            $table->string('repere', 160)->nullable();

            // Quand : maintenant, aujourdhui, demain ou date (avec date_souhaitee).
            $table->string('quand', 12);
            $table->date('date_souhaitee')->nullable();

            // Mise en relation : technicien recommandé par TerraClick ou choisi par le client.
            $table->string('mode', 12);
            $table->foreignId('prestataire_id')->nullable()->constrained()->nullOnDelete();

            // Paiement convenu avec le technicien ; aucun fonds ne transite par TerraClick.
            $table->string('paiement', 20);
            $table->json('photos')->nullable();

            // envoyee pour l'instant ; acceptation et suivi de mission arrivent au lot 2.
            $table->string('statut', 20)->default('envoyee');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};
