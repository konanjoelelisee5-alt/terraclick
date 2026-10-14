<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ModifierProfilRequest extends FormRequest
{
    public function rules(): array
    {
        // Le nom est obligatoire tant que le profil n'a jamais été rempli.
        $nomRequis = $this->user()->profilComplet() ? 'sometimes' : 'required';

        return [
            'nom' => [$nomRequis, 'string', 'min:2', 'max:80'],
            'quartier_id' => ['sometimes', 'nullable', 'integer', 'exists:quartiers,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Indiquez votre prénom et votre nom.',
            'nom.min' => 'Le nom est trop court.',
            'nom.max' => 'Le nom ne doit pas dépasser :max caractères.',
            'quartier_id.exists' => 'Ce quartier n\'existe pas.',
        ];
    }
}
