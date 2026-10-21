<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Réponse du technicien quand il accepte : estimation en francs CFA et créneau proposé.
        Schema::table('demandes', function (Blueprint $table) {
            $table->unsignedInteger('estimation')->nullable()->after('paiement');
            $table->string('creneau', 120)->nullable()->after('estimation');
            $table->index(['prestataire_id', 'statut']);
        });
    }

    public function down(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            $table->dropIndex(['prestataire_id', 'statut']);
            $table->dropColumn(['estimation', 'creneau']);
        });
    }
};
