<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Les trois critères de l'écran d'avis, de 1 à 5.
            $table->unsignedTinyInteger('note_ponctualite');
            $table->unsignedTinyInteger('note_qualite');
            $table->unsignedTinyInteger('note_prix');
            $table->decimal('note', 2, 1);
            $table->text('commentaire')->nullable();
            $table->timestamps();

            // Un avis par client et par prestataire.
            $table->unique(['prestataire_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};
