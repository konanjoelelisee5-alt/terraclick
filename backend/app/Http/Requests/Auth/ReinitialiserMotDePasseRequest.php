<?php

namespace App\Http\Requests\Auth;

use App\Support\Telephone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/** Nouveau mot de passe, prouvé par le code reçu sur le numéro. */
class ReinitialiserMotDePasseRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'telephone' => Telephone::normaliser($this->input('telephone')) ?? $this->input('telephone'),
            'code' => preg_replace('/\D/', '', (string) $this->input('code')),
        ]);
    }

    public function rules(): array
    {
        return [
            'telephone' => ['required', 'string', 'regex:'.Telephone::FORMAT],
            'code' => ['required', 'digits:'.config('otp.longueur')],
            'mot_de_passe' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
            'appareil' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return self::messagesMotDePasse() + [
            'telephone.required' => 'Indiquez votre numéro de téléphone.',
            'telephone.regex' => 'Ce numéro n\'est pas un numéro ivoirien valide.',
            'code.required' => 'Saisissez le code reçu.',
            'code.digits' => 'Le code comporte :digits chiffres.',
        ];
    }

    /**
     * Messages communs à l'inscription et à la réinitialisation.
     *
     * @return array<string, string>
     */
    public static function messagesMotDePasse(): array
    {
        return [
            'mot_de_passe.required' => 'Choisissez un mot de passe.',
            'mot_de_passe.confirmed' => 'Les deux mots de passe ne sont pas identiques.',
            'mot_de_passe.min' => 'Le mot de passe doit faire au moins :min caractères.',
            'mot_de_passe.letters' => 'Le mot de passe doit contenir au moins une lettre.',
            'mot_de_passe.numbers' => 'Le mot de passe doit contenir au moins un chiffre.',
        ];
    }
}
