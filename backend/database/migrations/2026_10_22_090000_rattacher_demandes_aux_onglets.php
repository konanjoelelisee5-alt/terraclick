<?php

use App\Models\Accord;
use App\Models\Demande;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Toute demande envoyée à un prestataire a désormais son onglet : celles d'avant ce
        // changement le reçoivent ici, avec le statut qui correspond au leur.
        Demande::whereNotNull('prestataire_id')->whereDoesntHave('accord')->each(fn (Demande $d) => Accord::pourDemande($d));
    }

    public function down(): void
    {
        // Les onglets rattachés restent : ils ne se distinguent pas de ceux créés ensuite.
    }
};
