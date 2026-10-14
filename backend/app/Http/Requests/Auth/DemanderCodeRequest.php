<?php

namespace App\Http\Requests\Auth;

use App\Support\Telephone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DemanderCodeRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'telephone' => Telephone::normaliser($this->input('telephone')) ?? $this->input('telephone'),
            'canal' => $this->input('canal', 'sms'),
        ]);
    }

    public function rules(): array
    {
        return [
            'telephone' => ['required', 'string', 'regex:'.Telephone::FORMAT],
            'canal' => ['required', Rule::in(['sms', 'whatsapp'])],
        ];
    }

    public function messages(): array
    {
        return [
            'telephone.required' => 'Indiquez votre numéro de téléphone.',
            'telephone.regex' => 'Ce numéro n\'est pas un numéro ivoirien valide (10 chiffres, ex. 07 00 00 00 00).',
            'canal.in' => 'Le code peut être envoyé par SMS ou par WhatsApp.',
        ];
    }
}
