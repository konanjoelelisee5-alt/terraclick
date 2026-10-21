<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Relations abouties : le client confirme qu'il a conclu avec un technicien, qu'il l'ait
        // joint par appel, WhatsApp, message ou par une demande dans l'application. Ce sont les
        // « onglets » du client, avec un reçu pour chaque dépannage.
        Schema::create('accords', function (Blueprint $table) {
            $table->id();
            // ACC-2026-00001, posée juste après l'insertion.
            $table->string('reference', 20)->nullable()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prestataire_id')->constrained()->restrictOnDelete();
            $table->foreignId('prestation_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('demande_id')->nullable()->unique()->constrained()->nullOnDelete();
            // Le travail convenu, en clair (« Réparation de tuyau cassé »).
            $table->string('objet', 160);
            // La recherche qui a mené au technicien (« tuyau cassé »).
            $table->string('recherche')->nullable();
            // appel, whatsapp, message ou demande
            $table->string('canal', 12);
            $table->unsignedInteger('montant')->nullable();
            $table->date('date_intervention')->nullable();
            // conclu, puis termine
            $table->string('statut', 12)->default('conclu');
            $table->timestamp('termine_le')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accords');
    }
};
