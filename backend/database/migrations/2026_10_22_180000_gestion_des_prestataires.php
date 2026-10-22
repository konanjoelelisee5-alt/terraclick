<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| Gestion des prestataires par l'équipe :
|  - un statut en trois temps : actif, suspendu (fiche masquée, réactivable), bloqué (fiche
|    masquée et espace prestataire fermé) ; la colonne `actif` reste le reflet de « actif » ;
|  - chaque pièce du dossier se vérifie une à une (vérifiée ou refusée, avec un motif) ;
|  - les sanctions (avertissement, suspension, blocage, réactivation) sont tenues dans un journal ;
|  - les pièces des candidatures déjà validées rejoignent le dossier de la fiche.
*/
return new class extends Migration
{
    /** Pièces de candidature déjà reprises sous un autre nom par la fiche. */
    private const DOCUMENTS_FICHE = [
        'piece_recto' => 'cni_gerant',
        'rccm' => 'registre_commerce',
        'attestation_fiscale' => 'attestation_fiscale',
        'assurance_decennale' => 'assurance_decennale',
    ];

    public function up(): void
    {
        Schema::table('prestataires', function (Blueprint $table) {
            $table->string('statut', 12)->default('actif')->after('actif');
            $table->text('statut_motif')->nullable()->after('statut');
            $table->timestamp('statut_le')->nullable()->after('statut_motif');
        });
        DB::table('prestataires')->where('actif', false)->update(['statut' => 'suspendu']);

        Schema::table('documents_prestataire', function (Blueprint $table) {
            $table->string('mime', 100)->nullable()->after('fichier');
            $table->text('motif')->nullable()->after('statut');
            $table->foreignId('verifie_par')->nullable()->after('verifie_le')->constrained('users')->nullOnDelete();
        });

        Schema::create('sanctions_prestataire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestataire_id')->constrained()->cascadeOnDelete();
            // avertissement, suspension, blocage, reactivation
            $table->string('type', 14);
            $table->text('motif');
            $table->foreignId('signalement_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        // Les pièces des candidatures validées : toutes dans le dossier de la fiche.
        $candidatures = DB::table('candidatures')->where('statut', 'validee')->whereNotNull('prestataire_id')->get(['id', 'prestataire_id', 'traite_le']);
        foreach ($candidatures as $c) {
            foreach (DB::table('candidature_documents')->where('candidature_id', $c->id)->get() as $piece) {
                $type = self::DOCUMENTS_FICHE[$piece->type] ?? $piece->type;
                $existe = DB::table('documents_prestataire')->where('prestataire_id', $c->prestataire_id)->where('type', $type);
                if ($existe->exists()) {
                    $existe->whereNull('mime')->update(['mime' => $piece->mime]);

                    continue;
                }
                DB::table('documents_prestataire')->insert([
                    'prestataire_id' => $c->prestataire_id,
                    'type' => $type,
                    'statut' => 'verifie',
                    'fichier' => $piece->fichier,
                    'mime' => $piece->mime,
                    'verifie_le' => $c->traite_le,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sanctions_prestataire');
        Schema::table('documents_prestataire', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verifie_par');
            $table->dropColumn(['mime', 'motif']);
        });
        Schema::table('prestataires', fn (Blueprint $table) => $table->dropColumn(['statut', 'statut_motif', 'statut_le']));
    }
};
