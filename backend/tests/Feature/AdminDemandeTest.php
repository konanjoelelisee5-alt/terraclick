<?php

namespace Tests\Feature;

use App\Models\Accord;
use App\Models\Demande;
use App\Models\Prestataire;
use App\Models\Quartier;
use App\Models\Signalement;
use App\Models\User;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PrestataireSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Demandes pilotées par l'équipe : filtres, détail et historique complet, attribution et
 * réattribution, relance, annulation, résolution d'un litige.
 */
class AdminDemandeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $manager;

    private User $client;

    private Prestataire $koffi;

    private Prestataire $ali;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mvp.actif' => true]);
        $this->seed([CatalogueSeeder::class, PrestataireSeeder::class, DemoSeeder::class]);
        $this->admin = User::where('telephone', '+2250701010101')->firstOrFail();
        $this->manager = User::where('telephone', '+2250702020202')->firstOrFail();
        $this->client = User::where('telephone', '+2250758421903')->firstOrFail();
        $this->koffi = Prestataire::where('nom', 'Koffi Tanoh')->firstOrFail();
        $this->ali = Prestataire::where('nom', 'Ali Diomandé')->firstOrFail();
    }

    private function demande(array $champs = []): Demande
    {
        $demande = Demande::create([
            'user_id' => $this->client->id,
            'secteur' => 'plomberie',
            'probleme' => 'Fuite d\'eau',
            'precision' => 'Sous l\'évier de la cuisine.',
            'quartier_id' => Quartier::where('slug', 'habitat')->value('id'),
            'quand' => 'maintenant',
            'mode' => 'choisi',
            'paiement' => 'especes',
            'prestataire_id' => $this->koffi->id,
            ...$champs,
        ]);
        Accord::pourDemande($demande->refresh());

        return $demande;
    }

    public function test_filtrer_toutes_les_demandes(): void
    {
        $assignee = $this->demande();
        $this->demande(['statut' => 'refusee']);

        $ids = fn (string $requete) => collect($this->actingAs($this->admin)->getJson("/api/admin/demandes?{$requete}")->assertOk()->json('data'))->pluck('id');

        $this->assertContains($assignee->id, $ids('etat=assignee'));
        $this->assertNotContains($assignee->id, $ids('etat=en_attente'));
        $this->assertTrue(collect($this->getJson('/api/admin/demandes?etat=en_attente')->json('data'))->every(fn (array $d) => $d['etat_equipe']['cle'] === 'en_attente'));
        $this->assertContains($assignee->id, $ids("prestataire={$this->koffi->id}&quartier={$assignee->quartier_id}&du=".now()->toDateString().'&au='.now()->toDateString()));
        $this->assertNotContains($assignee->id, $ids('du='.now()->addDay()->toDateString()));
        $this->getJson('/api/admin/demandes?du=2026-10-10&au=2026-10-01')->assertStatus(422);
        $this->actingAs($this->client)->getJson('/api/admin/demandes')->assertForbidden();
    }

    public function test_le_detail_et_l_historique_complet(): void
    {
        $d = $this->demande();
        $detail = $this->actingAs($this->manager)->getJson("/api/admin/demandes/{$d->id}")->assertOk()->json('data');

        $this->assertSame('Sous l\'évier de la cuisine.', $detail['precision']);
        $this->assertSame('Koffi Tanoh', $detail['prestataire_contact']['nom']);
        $this->assertSame(['attribuer', 'relancer', 'annuler'], $detail['actions']);
        $this->assertSame('Demande envoyée', $detail['historique'][0]['titre']);
    }

    public function test_reattribuer_une_demande_refusee(): void
    {
        $d = $this->demande(['statut' => 'refusee']);

        $candidats = collect($this->actingAs($this->manager)->getJson("/api/admin/demandes/{$d->id}/candidats")->assertOk()->json('data'));
        $this->assertNotContains($this->koffi->id, $candidats->pluck('id'));
        $this->assertContains($this->ali->id, $candidats->pluck('id'));

        // Un électricien ne reçoit pas une fuite d'eau.
        $electricien = Prestataire::whereHas('categories', fn ($c) => $c->where('slug', 'electriciens'))->whereDoesntHave('categories', fn ($c) => $c->where('slug', 'plombiers'))->firstOrFail();
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/attribuer", ['prestataire_id' => $electricien->id])->assertStatus(422);

        $detail = $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/attribuer", ['prestataire_id' => $this->ali->id, 'message' => 'Koffi est indisponible.'])
            ->assertOk()->json('data');
        $this->assertSame('envoyee', $detail['statut']);
        $this->assertSame('assignee', $detail['etat_equipe']['cle']);
        $this->assertSame('Ali Diomandé', $detail['prestataire_contact']['nom']);
        $this->assertSame('Réattribuée à Ali Diomandé. Koffi est indisponible.', collect($detail['historique'])->last()['texte']);
        $this->assertSame($this->ali->id, Accord::where('demande_id', $d->id)->value('prestataire_id'));

        // Koffi ne la voit plus ; le client est prévenu.
        $this->actingAs($this->koffi->utilisateur)->getJson("/api/pro/demandes/{$d->id}")->assertNotFound();
        $this->actingAs($this->client)->getJson('/api/notifications')->assertJsonPath('data.0.titre', 'Demande confiée à Ali Diomandé');
    }

    public function test_relancer_un_prestataire_qui_ne_repond_pas(): void
    {
        $d = $this->demande();

        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/relancer")->assertOk();
        // Le prestataire voit la relance ; le client n'en est pas notifié.
        $this->actingAs($this->koffi->utilisateur)->getJson("/api/pro/demandes/{$d->id}")->assertJsonPath('data.relance.message', 'Un client attend votre réponse.');
        $this->assertNotContains('relance', collect($this->actingAs($this->client)->getJson('/api/notifications')->json('data'))->pluck('statut'));

        $acceptee = $this->demande(['statut' => 'acceptee']);
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$acceptee->id}/relancer")->assertStatus(422);
    }

    public function test_annuler_une_demande(): void
    {
        $d = $this->demande(['statut' => 'acceptee']);

        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/annuler")->assertStatus(422)->assertJsonValidationErrors('motif');
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/annuler", ['motif' => 'Le client a signalé une fraude.'])->assertOk()
            ->assertJsonPath('data.statut', 'annulee')->assertJsonPath('data.actions', []);
        $this->assertSame('annule', Accord::where('demande_id', $d->id)->value('statut'));
        $this->actingAs($this->client)->getJson('/api/notifications')->assertJsonPath('data.0.titre', 'Demande annulée');
        $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/annuler", ['motif' => 'Deuxième fois.'])->assertStatus(422);
    }

    public function test_resoudre_un_litige(): void
    {
        $d = $this->demande(['statut' => 'terminee']);
        Signalement::create(['demande_id' => $d->id, 'user_id' => $this->client->id, 'motif' => 'travail', 'message' => 'La fuite a repris le lendemain.']);

        $this->actingAs($this->client)->postJson("/api/admin/demandes/{$d->id}/litige", ['decision' => 'x', 'issue' => 'aucune'])->assertForbidden();
        $detail = $this->actingAs($this->manager)->postJson("/api/admin/demandes/{$d->id}/litige", [
            'decision' => 'Koffi repasse gratuitement ; intervention réputée faite.',
            'issue' => 'cloturer',
            'avertir' => true,
        ])->assertOk()->json('data');

        $this->assertSame('confirmee', $detail['statut']);
        $this->assertSame([], $detail['alertes']);
        $titres = collect($detail['historique'])->pluck('titre');
        $this->assertContains('Signalement : Travail mal fait', $titres);
        $this->assertContains('Signalement traité', $titres);
        $this->assertContains('Litige résolu par l\'équipe', $titres);
        $this->assertContains('Avertissement du prestataire', $titres);
        $this->assertSame('avertissement', $this->koffi->sanctions()->value('type'));
        $this->actingAs($this->client)->getJson('/api/notifications')->assertJsonPath('data.1.titre', 'Signalement traité');
    }
}
