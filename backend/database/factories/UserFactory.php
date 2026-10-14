<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'telephone' => '+22507'.fake()->unique()->numerify('########'),
            'nom' => fake()->name(),
            'telephone_verifie_le' => now(),
        ];
    }

    /** Compte créé par la vérification du numéro, profil pas encore rempli. */
    public function sansProfil(): static
    {
        return $this->state(fn (array $attributes) => [
            'nom' => null,
        ]);
    }
}
