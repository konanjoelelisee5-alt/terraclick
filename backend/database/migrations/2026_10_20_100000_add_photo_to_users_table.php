<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Photo de profil, réduite à 256 px sur l'appareil et gardée en base (data URL) :
        // elle survit aux redéploiements, contrairement aux fichiers envoyés sur Render.
        Schema::table('users', function (Blueprint $table) {
            $table->mediumText('photo')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
};
