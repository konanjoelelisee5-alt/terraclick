<?php

namespace App\Http\Requests\Auth;

use App\Support\Telephone;
use Illuminate\Foundation\Http\FormRequest;

class VerifierCodeRequest extends FormRequest
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
            // Libellé de l'appareil, visible plus tard dans la liste des sessions.
            'appareil' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'telephone.required' => 'Indiquez votre numéro de téléphone.',
            'telephone.regex' => 'Ce numéro n\'est pas un numéro ivoirien valide.',
            'code.required' => 'Saisissez le code reçu.',
            'code.digits' => 'Le code comporte :digits chiffres.',
        ];
    }
}
