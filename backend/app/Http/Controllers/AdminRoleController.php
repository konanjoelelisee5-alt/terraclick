<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * « Rôles et permissions » : la matrice rôles × permissions, rangée par interface. Le rôle
 * administrateur garde toujours tout ; les autres se modifient ici (RolePolicy).
 */
class AdminRoleController extends Controller
{
    /** GET /api/admin/roles */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->withCount('utilisateurs')->orderBy('id')->get();

        return response()->json(['data' => [
            'roles' => $roles->map(fn (Role $r) => [
                'id' => $r->id,
                'cle' => $r->cle,
                'nom' => $r->nom,
                'description' => $r->description,
                'utilisateurs' => $r->utilisateurs_count,
                'modifiable' => $r->cle !== Role::ADMIN,
                'permissions' => $r->cle === Role::ADMIN ? Permission::pluck('cle') : $r->permissions->pluck('cle'),
            ]),
            'groupes' => Permission::orderBy('id')->get()->groupBy('groupe')->map(fn ($liste, string $groupe) => [
                'nom' => $groupe,
                'permissions' => $liste->map(fn (Permission $p) => ['cle' => $p->cle, 'nom' => $p->nom])->values(),
            ])->values(),
        ]]);
    }

    /** PUT /api/admin/roles/{role} — la liste complète de ses permissions. */
    public function update(Request $request, Role $role): JsonResponse
    {
        Gate::authorize('update', $role);
        $cles = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'cle')],
        ])['permissions'];

        $role->permissions()->sync(Permission::whereIn('cle', $cles)->pluck('id'));

        return response()->json(['data' => ['id' => $role->id, 'cle' => $role->cle, 'permissions' => $role->permissions()->pluck('cle')]]);
    }
}
