<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Comptes sans mot de passe : le numéro de téléphone est l'identifiant,
     * prouvé par un code à usage unique (voir otp_codes).
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Format international normalisé : +225 suivi des 10 chiffres.
            $table->string('telephone', 20)->unique();
            // Vide tant que le profil n'a pas été complété après la première connexion.
            $table->string('nom')->nullable();
            $table->timestamp('telephone_verifie_le')->nullable();
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('sessions');
    }
};
