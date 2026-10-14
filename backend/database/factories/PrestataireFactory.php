<?php

namespace Database\Factories;

use App\Models\Prestataire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Prestataire>
 */
class PrestataireFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->company(),
            'metier' => fake()->randomElement(['Plombier', 'Électricien', 'Mécanicien auto', 'Maçon']),
            'description' => fake()->sentence(12),
            'prix_min' => 5000,
            'prix_max' => 20000,
            'delai_reponse_minutes' => 30,
            'note_moyenne' => 0,
            'nombre_avis' => 0,
            'actif' => true,
        ];
    }

    /** Position autour du centre de Yamoussoukro. */
    public function aPosition(float $latitude, float $longitude): static
    {
        return $this->state(fn (array $attributes) => compact('latitude', 'longitude'));
    }
}
