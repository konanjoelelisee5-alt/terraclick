<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Journal d'une demande : chaque changement de statut, qui l'a fait et son message.
        // Il sert au suivi affiché au client et au technicien, et à l'administration.
        Schema::create('demande_evenements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demande_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // client, technicien ou systeme
            $table->string('auteur', 12);
            $table->string('statut', 20);
            $table->text('message')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['demande_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demande_evenements');
    }
};
