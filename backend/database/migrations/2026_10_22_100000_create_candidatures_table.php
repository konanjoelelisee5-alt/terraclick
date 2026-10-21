<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Équipe TerraClick : vérifie les candidatures des prestataires.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('est_admin')->default(false)->after('password');
        });

        // « Devenir prestataire » : le dossier envoyé pour vérification (config/candidature.php).
        Schema::create('candidatures', function (Blueprint $table) {
            $table->id();
            // CAN-2026-00001, posée juste après l'insertion.
            $table->string('reference', 20)->nullable()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // artisan, entreprise ou pressing
            $table->string('type', 12);
            // en_attente, validee ou refusee
            $table->string('statut', 12)->default('en_attente');
            $table->string('nom_activite', 120);
            $table->string('responsable', 120);
            $table->string('telephone', 20);
            // Services (clés de config/secteurs.php) et quartiers d'intervention.
            $table->json('secteurs');
            $table->foreignId('quartier_id')->constrained()->restrictOnDelete();
            $table->json('quartiers');
            $table->text('description');
            $table->unsignedTinyInteger('experience_annees')->nullable();
            $table->string('horaires', 160)->nullable();
            $table->string('prix', 160)->nullable();
            $table->json('paiements');
            // Ce qui est propre au type : référence, RCCM, NCC, local, collecte, délais…
            $table->json('details')->nullable();
            $table->text('motif_refus')->nullable();
            $table->foreignId('prestataire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('traite_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('traite_le')->nullable();
            $table->timestamps();

            $table->index(['statut', 'created_at']);
        });

        // Pièces jointes, gardées hors du dossier public : seule l'équipe les ouvre.
        Schema::create('candidature_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidature_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('fichier');
            $table->string('mime', 60);
            $table->timestamps();

            $table->unique(['candidature_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidature_documents');
        Schema::dropIfExists('candidatures');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('est_admin');
        });
    }
};
