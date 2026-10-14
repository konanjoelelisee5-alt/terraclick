<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('villes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('slug')->unique();
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('quartiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ville_id')->constrained()->cascadeOnDelete();
            $table->string('nom');
            $table->string('slug');
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamps();

            $table->unique(['ville_id', 'slug']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('quartier_id')->nullable()->after('nom')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quartier_id');
        });
        Schema::dropIfExists('quartiers');
        Schema::dropIfExists('villes');
    }
};
