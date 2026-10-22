<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Prestataire;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rôles et permissions de config/acces.php, recopiés en base. Relancé à chaque déploiement :
 * il ajoute ce qui manque sans écraser les permissions qu'un administrateur a changées depuis
 * l'écran « Rôles et permissions » (sauf pour un rôle tout neuf, qui reçoit sa liste de départ).
 * Il range aussi les comptes : prestataire pour ceux qui ont une fiche, client pour les autres.
 */
class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('acces.permissions') as $groupe => $permissions) {
            foreach ($permissions as $cle => $nom) {
                Permission::updateOrCreate(['cle' => $cle], ['nom' => $nom, 'groupe' => $groupe]);
            }
        }

        foreach (config('acces.roles') as $cle => $def) {
            $role = Role::firstOrNew(['cle' => $cle]);
            $nouveau = ! $role->exists;
            $role->fill(['nom' => $def['nom'], 'description' => $def['description']])->save();

            // Administrateur : toujours tout. Rôle neuf : sa liste de départ.
            if ($cle === Role::ADMIN || $nouveau) {
                $permissions = $def['permissions'] === ['*'] ? Permission::pluck('id') : Permission::whereIn('cle', $def['permissions'])->pluck('id');
                $role->permissions()->sync($permissions);
            }
        }

        // Anciens administrateurs (colonne `est_admin`, retirée par la migration des rôles).
        if (Schema::hasTable('roles_a_reprendre')) {
            foreach (DB::table('roles_a_reprendre')->get() as $ligne) {
                if ($role = Role::where('cle', $ligne->role)->first()) {
                    $role->utilisateurs()->syncWithoutDetaching([$ligne->user_id]);
                }
            }
            DB::table('roles_a_reprendre')->delete();
        }

        // Une fiche reliée au compte : rôle prestataire. Aucun rôle : rôle client.
        $prestataire = Role::where('cle', 'prestataire')->firstOrFail();
        $prestataire->utilisateurs()->syncWithoutDetaching(Prestataire::whereNotNull('user_id')->pluck('user_id')->unique()->values());

        $client = Role::where('cle', config('acces.role_par_defaut'))->firstOrFail();
        $client->utilisateurs()->syncWithoutDetaching(User::whereDoesntHave('roles')->pluck('id'));
    }
}
