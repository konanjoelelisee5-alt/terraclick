<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Finances et litiges :
|  - réglages de la plateforme (commission globale, négociation directe, moyens de paiement…) ;
|  - commission propre à un secteur, si besoin ;
|  - une commission par mission accomplie, au taux du jour, et les paiements de commission
|    enregistrés par l'équipe (le solde d'un prestataire = commissions − paiements) ;
|  - signalements des deux parties (client ou prestataire), avec photos à l'appui ;
|  - décisions de litige (remboursement, nouvelle intervention, avertissement, suspension, blocage).
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reglages', function (Blueprint $table) {
            $table->string('cle', 60)->primary();
            $table->json('valeur')->nullable();
            $table->timestamps();
        });

        Schema::table('secteurs', function (Blueprint $table) {
            $table->decimal('commission', 5, 2)->nullable()->after('couleur');
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->string('secteur', 60);
            // Montant de la mission encaissé par le prestataire, taux appliqué, commission due.
            $table->unsignedInteger('montant_mission');
            $table->decimal('taux', 5, 2);
            $table->unsignedInteger('montant');
            $table->timestamps();
            $table->index(['prestataire_id', 'created_at']);
        });

        Schema::create('paiements_commission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('montant');
            $table->string('moyen', 20);
            $table->string('reference', 80)->nullable();
            $table->text('note')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->date('paye_le');
            $table->timestamps();
            $table->index(['prestataire_id', 'paye_le']);
        });

        Schema::table('signalements', function (Blueprint $table) {
            // Qui déclare : le client ou le prestataire.
            $table->string('role', 12)->default('client')->after('user_id');
            $table->json('photos')->nullable()->after('message');
        });

        Schema::create('decisions_litige', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('decision');
            // Mesures prises : remboursement, reintervention, avertissement, suspension, blocage.
            $table->json('mesures');
            $table->string('issue', 12)->default('aucune');
            $table->unsignedInteger('remboursement')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('decisions_litige');
        Schema::table('signalements', fn (Blueprint $table) => $table->dropColumn(['role', 'photos']));
        Schema::dropIfExists('paiements_commission');
        Schema::dropIfExists('commissions');
        Schema::table('secteurs', fn (Blueprint $table) => $table->dropColumn('commission'));
        Schema::dropIfExists('reglages');
    }
};
