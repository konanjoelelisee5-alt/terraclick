<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| Zones et quartiers gérés par l'équipe :
|  - un quartier s'active ou se désactive (désactivé, il n'est plus proposé aux clients) ;
|  - il peut limiter les secteurs disponibles (null : tous) et porter des frais de déplacement ;
|  - les prestataires ont leurs zones d'intervention (plusieurs quartiers), reprises ici de leur
|    quartier, de leur candidature et du texte « zone d'intervention » de leur fiche ;
|  - la demande garde les frais de déplacement de son quartier au moment de l'envoi.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quartiers', function (Blueprint $table) {
            $table->boolean('actif')->default(true)->after('slug');
            $table->json('secteurs')->nullable()->after('actif');
            $table->unsignedInteger('frais_deplacement')->nullable()->after('secteurs');
        });

        Schema::create('prestataire_quartier', function (Blueprint $table) {
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quartier_id')->constrained()->cascadeOnDelete();
            $table->primary(['prestataire_id', 'quartier_id']);
        });

        Schema::table('demandes', function (Blueprint $table) {
            $table->unsignedInteger('frais_deplacement')->nullable()->after('estimation');
        });

        $quartiers = DB::table('quartiers')->get(['id', 'ville_id', 'nom']);
        $sans = fn (string $t) => mb_strtolower(trim(iconv('UTF-8', 'ASCII//TRANSLIT', $t) ?: $t));
        $zones = [];
        foreach (DB::table('prestataires')->get(['id', 'quartier_id', 'zone_intervention']) as $p) {
            if ($p->quartier_id) {
                $zones[$p->id][$p->quartier_id] = true;
                // Les noms cités dans « zone d'intervention », dans la ville de son quartier.
                $ville = $quartiers->firstWhere('id', $p->quartier_id)?->ville_id;
                foreach (preg_split('/[,;·\/]+/u', (string) $p->zone_intervention) as $nom) {
                    if ($q = $quartiers->first(fn ($q) => $q->ville_id === $ville && $sans($q->nom) === $sans($nom))) {
                        $zones[$p->id][$q->id] = true;
                    }
                }
            }
        }
        foreach (DB::table('candidatures')->where('statut', 'validee')->whereNotNull('prestataire_id')->get(['prestataire_id', 'quartiers']) as $c) {
            foreach (json_decode((string) $c->quartiers, true) ?: [] as $id) {
                $zones[$c->prestataire_id][(int) $id] = true;
            }
        }
        $lignes = [];
        foreach ($zones as $prestataire => $ids) {
            foreach (array_keys($ids) as $quartier) {
                if ($quartiers->contains('id', $quartier)) {
                    $lignes[] = ['prestataire_id' => $prestataire, 'quartier_id' => $quartier];
                }
            }
        }
        foreach (array_chunk($lignes, 500) as $paquet) {
            DB::table('prestataire_quartier')->insertOrIgnore($paquet);
        }
    }

    public function down(): void
    {
        Schema::table('demandes', fn (Blueprint $table) => $table->dropColumn('frais_deplacement'));
        Schema::dropIfExists('prestataire_quartier');
        Schema::table('quartiers', fn (Blueprint $table) => $table->dropColumn(['actif', 'secteurs', 'frais_deplacement']));
    }
};
