<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('telephone', 20)->index();
            $table->enum('canal', ['sms', 'whatsapp']);
            // Le code n'est jamais stocké en clair.
            $table->string('code_hash');
            $table->unsignedTinyInteger('tentatives')->default(0);
            // dateTime et non timestamp : MariaDB/MySQL sans explicit_defaults_for_timestamp
            // ajoutent ON UPDATE CURRENT_TIMESTAMP au premier timestamp non nul de la table,
            // ce qui réécrirait l'expiration à chaque essai.
            $table->dateTime('expire_le');
            $table->timestamp('utilise_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
