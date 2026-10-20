<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhotoProfilTest extends TestCase
{
    use RefreshDatabase;

    /** Plus petite image JPEG valide en data URL suffit : le serveur vérifie le format, pas le dessin. */
    private const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQ==';

    public function test_le_client_ajoute_puis_retire_sa_photo(): void
    {
        $client = User::factory()->create(['nom' => 'Aya Konan']);

        $this->actingAs($client)->putJson('/api/moi/photo', ['photo' => self::PHOTO])
            ->assertOk()
            ->assertJsonPath('data.photo', self::PHOTO);
        $this->actingAs($client)->getJson('/api/moi')->assertJsonPath('data.photo', self::PHOTO);

        $this->actingAs($client)->deleteJson('/api/moi/photo')->assertOk()->assertJsonPath('data.photo', null);
    }

    public function test_seules_les_images_sont_acceptees(): void
    {
        $client = User::factory()->create();

        $this->actingAs($client)->putJson('/api/moi/photo', ['photo' => 'data:text/html;base64,PHNjcmlwdD4='])
            ->assertJsonValidationErrors(['photo' => 'Seules les photos JPEG, PNG ou WebP sont acceptées.']);
        $this->actingAs($client)->putJson('/api/moi/photo', ['photo' => 'data:image/jpeg;base64,'.str_repeat('A', 400001)])
            ->assertJsonValidationErrors(['photo' => 'Cette photo est trop lourde.']);
    }

    public function test_il_faut_etre_connecte(): void
    {
        $this->putJson('/api/moi/photo', ['photo' => self::PHOTO])->assertUnauthorized();
    }
}
