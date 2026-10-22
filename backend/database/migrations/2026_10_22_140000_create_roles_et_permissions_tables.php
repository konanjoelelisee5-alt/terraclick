<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rôles (client, prestataire, manager, admin) et permissions (config/acces.php).
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('cle', 30)->unique();
            $table->string('nom', 60);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('cle', 60)->unique();
            $table->string('nom', 120);
            // L'interface qu'elle ouvre : « Espace administrateur »…
            $table->string('groupe', 60);
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'user_id']);
        });

        // L'ancien drapeau `est_admin` devient le rôle « admin » (posé par RolesPermissionsSeeder) :
        // les comptes concernés sont notés ici, puis la colonne disparaît.
        Schema::create('roles_a_reprendre', function (Blueprint $table) {
            $table->foreignId('user_id')->primary();
            $table->string('role', 30);
        });
        DB::table('roles_a_reprendre')->insertUsing(['user_id', 'role'], DB::table('users')->where('est_admin', true)->selectRaw("id, 'admin'"));

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('est_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('est_admin')->default(false)->after('password');
        });
        Schema::dropIfExists('roles_a_reprendre');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
