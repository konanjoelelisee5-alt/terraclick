<?php

namespace App\Http\Requests\Auth;

use App\Models\Quartier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ModifierProfilRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        // Un e-mail laissé vide efface l'adresse plutôt que d'échouer à la validation.
        if ($this->has('email')) {
            $email = trim((string) $this->input('email'));
            $this->merge(['email' => $email === '' ? null : mb_strtolower($email)]);
        }
    }

    public function rules(): array
    {
        // Le nom est obligatoire tant que le profil n'a jamais été rempli.
        $nomRequis = $this->user()->profilComplet() ? 'sometimes' : 'required';

        return [
            'nom' => [$nomRequis, 'string', 'min:2', 'max:80'],
            'email' => ['sometimes', 'nullable', 'email', 'max:120', Rule::unique('users', 'email')->ignore($this->user()->id)],
            'ville_id' => ['sometimes', 'nullable', 'integer', 'exists:villes,id'],
            'quartier_id' => ['sometimes', 'nullable', 'integer', 'exists:quartiers,id'],
        ];
    }

    /** Un quartier doit appartenir à la ville choisie. */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty() || ! $this->filled(['ville_id', 'quartier_id'])) {
                    return;
                }
                $villeDuQuartier = (int) Quartier::whereKey($this->integer('quartier_id'))->value('ville_id');
                if ($villeDuQuartier !== $this->integer('ville_id')) {
                    $validator->errors()->add('quartier_id', 'Ce quartier n\'appartient pas à la ville choisie.');
                }
            },
        ];
    }

    /** Données à enregistrer : la ville se déduit du quartier quand elle n'est pas donnée. */
    public function profil(): array
    {
        $profil = $this->validated();
        if (! empty($profil['quartier_id']) && ! array_key_exists('ville_id', $profil)) {
            $profil['ville_id'] = Quartier::whereKey($profil['quartier_id'])->value('ville_id');
        }

        return $profil;
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Indiquez votre prénom et votre nom.',
            'nom.min' => 'Le nom est trop court.',
            'nom.max' => 'Le nom ne doit pas dépasser :max caractères.',
            'email.email' => 'Cette adresse e-mail n\'est pas valide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée par un autre compte.',
            'ville_id.exists' => 'Cette ville n\'est pas couverte.',
            'quartier_id.exists' => 'Ce quartier n\'existe pas.',
        ];
    }
}
