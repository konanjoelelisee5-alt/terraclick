<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Chargements des référentiels et de la démonstration (commande terraclick:amorcer) : leur
| empreinte évite de tout rejouer à chaque démarrage du serveur en ligne.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amorcages', function (Blueprint $table) {
            $table->id();
            $table->string('empreinte', 64);
            $table->boolean('demo')->default(false);
            $table->timestamp('fait_le')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amorcages');
    }
};
