<?php

namespace App\Http\Requests\Auth;

use App\Support\Telephone;
use Illuminate\Foundation\Http\FormRequest;

class ConnexionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'telephone' => Telephone::normaliser($this->input('telephone')) ?? $this->input('telephone'),
        ]);
    }

    public function rules(): array
    {
        return [
            'telephone' => ['required', 'string', 'regex:'.Telephone::FORMAT],
            'mot_de_passe' => ['required', 'string', 'max:200'],
            'appareil' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'telephone.required' => 'Indiquez votre numéro de téléphone.',
            'telephone.regex' => 'Ce numéro n\'est pas un numéro ivoirien valide.',
            'mot_de_passe.required' => 'Saisissez votre mot de passe.',
        ];
    }
}
