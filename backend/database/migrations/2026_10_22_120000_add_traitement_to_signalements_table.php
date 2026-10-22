<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Espace administrateur : l'équipe traite un signalement et note sa réponse.
        Schema::table('signalements', function (Blueprint $table) {
            $table->text('reponse')->nullable()->after('statut');
            $table->foreignId('traite_par')->nullable()->after('reponse')->constrained('users')->nullOnDelete();
            $table->timestamp('traite_le')->nullable()->after('traite_par');
        });
    }

    public function down(): void
    {
        Schema::table('signalements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('traite_par');
            $table->dropColumn(['reponse', 'traite_le']);
        });
    }
};
