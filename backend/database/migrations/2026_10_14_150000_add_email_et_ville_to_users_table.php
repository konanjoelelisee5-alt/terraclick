<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Champs facultatifs de l'inscription : un e-mail (reçus, récapitulatifs) et la
     * ville, utile hors de Yamoussoukro où les quartiers ne sont pas encore listés.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->unique()->after('nom');
            $table->foreignId('ville_id')->nullable()->after('email')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ville_id');
            $table->dropUnique(['email']);
            $table->dropColumn('email');
        });
    }
};
