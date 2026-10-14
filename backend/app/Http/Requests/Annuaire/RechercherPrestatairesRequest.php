<?php

namespace App\Http\Requests\Annuaire;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RechercherPrestatairesRequest extends FormRequest
{
    public const TRIS = ['pertinence', 'note', 'avis', 'distance', 'reponse'];

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'categorie' => ['nullable', 'string', 'exists:categories,slug'],
            'departement' => ['nullable', 'string', 'exists:departements,slug'],
            'ville' => ['nullable', 'string', 'exists:villes,slug'],
            'quartier' => ['nullable', 'integer', 'exists:quartiers,id'],
            // Position de l'utilisateur, pour « Autour de moi ».
            'lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:lng'],
            'lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:lat'],
            'rayon_km' => ['nullable', 'numeric', 'min:0.1', 'max:100', 'required_with_all:lat,lng'],
            'tri' => ['nullable', Rule::in(self::TRIS)],
            'par_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'categorie.exists' => 'Cette catégorie n\'existe pas.',
            'departement.exists' => 'Ce département n\'existe pas.',
            'ville.exists' => 'Cette ville n\'est pas couverte.',
            'quartier.exists' => 'Ce quartier n\'existe pas.',
            'lat.required_with' => 'La position doit comporter une latitude et une longitude.',
            'lng.required_with' => 'La position doit comporter une latitude et une longitude.',
            'rayon_km.required_with_all' => 'Le rayon de recherche demande une position.',
            'tri.in' => 'Tri inconnu. Valeurs possibles : '.implode(', ', self::TRIS).'.',
        ];
    }

    public function aPosition(): bool
    {
        return $this->filled(['lat', 'lng']);
    }
}
