<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Prestations de chaque secteur (« Réparation de tuyau », « Débouchage WC »…), avec le
        // vocabulaire qui les reconnaît dans une recherche et un prix indicatif en F CFA.
        Schema::create('prestations', function (Blueprint $table) {
            $table->id();
            // Clé du secteur (config/secteurs.php) : plomberie, electricite…
            $table->string('secteur', 40)->index();
            $table->string('nom', 120);
            $table->string('slug', 120)->unique();
            $table->string('description')->nullable();
            // Mots-clés pondérés, même syntaxe que config/secteurs.php (« tuyau* » => 3).
            $table->json('mots');
            $table->unsignedInteger('prix_min')->nullable();
            $table->unsignedInteger('prix_max')->nullable();
            // « par intervention », « par point »…
            $table->string('unite', 40)->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestations');
    }
};
