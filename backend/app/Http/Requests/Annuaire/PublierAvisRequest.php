<?php

namespace App\Http\Requests\Annuaire;

use Illuminate\Foundation\Http\FormRequest;

class PublierAvisRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'ponctualite' => ['required', 'integer', 'between:1,5'],
            'qualite' => ['required', 'integer', 'between:1,5'],
            'prix' => ['required', 'integer', 'between:1,5'],
            'commentaire' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            '*.required' => 'Donnez une note de 1 à 5 pour chaque critère.',
            '*.between' => 'Chaque note va de 1 à 5.',
            'commentaire.max' => 'Le commentaire ne doit pas dépasser :max caractères.',
        ];
    }
}
