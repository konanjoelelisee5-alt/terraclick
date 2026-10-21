<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Commande au pressing : service, express, mode de dépôt, heure du créneau, adresse
        // choisie et étape du suivi (config/pressing.php).
        Schema::table('demandes', function (Blueprint $table) {
            $table->string('service', 20)->nullable()->after('articles');
            $table->boolean('express')->default(false)->after('service');
            $table->string('depot', 12)->nullable()->after('express');
            $table->string('heure', 5)->nullable()->after('date_souhaitee');
            // « Domicile », « Bureau », ou le nom donné par le client.
            $table->string('adresse_libelle', 40)->nullable()->after('repere');
            $table->string('etape', 20)->nullable()->after('statut');
        });

        // Ce qui ne va pas dans une commande : retard, vêtement manquant, erreur, dommage.
        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('motif', 12);
            $table->text('message')->nullable();
            // ouvert, puis traite
            $table->string('statut', 10)->default('ouvert');
            $table->timestamps();
        });

        // Adresses enregistrées du client : domicile, bureau ou autre lieu.
        Schema::create('adresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // domicile, bureau ou autre
            $table->string('type', 10);
            $table->string('nom', 40);
            $table->foreignId('quartier_id')->constrained()->restrictOnDelete();
            $table->string('repere', 160)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adresses');
        Schema::dropIfExists('signalements');
        Schema::table('demandes', function (Blueprint $table) {
            $table->dropColumn(['service', 'express', 'depot', 'heure', 'adresse_libelle', 'etape']);
        });
    }
};
