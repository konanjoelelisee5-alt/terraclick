<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pack pressing : les articles envoyés au pressing, avec quantité et prix par pièce
        // (recalculés par l'API depuis config/pressing.php).
        Schema::table('demandes', function (Blueprint $table) {
            $table->json('articles')->nullable()->after('photos');
        });
    }

    public function down(): void
    {
        Schema::table('demandes', function (Blueprint $table) {
            $table->dropColumn('articles');
        });
    }
};
