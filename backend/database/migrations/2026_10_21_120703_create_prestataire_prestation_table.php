<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Prestations proposées par chaque technicien, avec son propre prix s'il l'a fixé
        // (sinon, le prix indicatif de la prestation s'affiche).
        Schema::create('prestataire_prestation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prestation_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('prix_min')->nullable();
            $table->unsignedInteger('prix_max')->nullable();
            $table->timestamps();

            $table->unique(['prestataire_id', 'prestation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestataire_prestation');
    }
};
