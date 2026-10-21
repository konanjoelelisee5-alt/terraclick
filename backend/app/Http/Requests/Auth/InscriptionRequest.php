<?php

namespace App\Http\Requests\Auth;

use App\Models\Quartier;
use App\Support\Telephone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

/** Création du compte : profil, mot de passe, et code reçu qui prouve le numéro. */
class InscriptionRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $email = trim((string) $this->input('email'));
        $this->merge([
            'telephone' => Telephone::normaliser($this->input('telephone')) ?? $this->input('telephone'),
            'code' => preg_replace('/\D/', '', (string) $this->input('code')) ?: null,
            'email' => $email === '' ? null : mb_strtolower($email),
        ]);
    }

    public function rules(): array
    {
        return [
            'telephone' => ['required', 'string', 'regex:'.Telephone::FORMAT],
            // Code reçu seulement si la vérification du numéro est activée (config/otp.php).
            'code' => [config('otp.verification_inscription') ? 'required' : 'nullable', 'digits:'.config('otp.longueur')],
            'nom' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['nullable', 'email', 'max:120', Rule::unique('users', 'email')->where(fn ($q) => $q->where('telephone', '!=', $this->input('telephone')))],
            'ville_id' => ['nullable', 'integer', 'exists:villes,id'],
            'quartier_id' => ['nullable', 'integer', 'exists:quartiers,id'],
            'mot_de_passe' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
            'appareil' => ['nullable', 'string', 'max:100'],
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

    /**
     * Profil à enregistrer : la ville se déduit du quartier quand elle n'est pas donnée.
     *
     * @return array{nom: string, email: ?string, ville_id: ?int, quartier_id: ?int}
     */
    public function profil(): array
    {
        $profil = $this->safe()->only(['nom', 'email', 'ville_id', 'quartier_id']) + ['email' => null, 'ville_id' => null, 'quartier_id' => null];
        if (! empty($profil['quartier_id']) && empty($profil['ville_id'])) {
            $profil['ville_id'] = Quartier::whereKey($profil['quartier_id'])->value('ville_id');
        }

        return $profil;
    }

    public function messages(): array
    {
        return ReinitialiserMotDePasseRequest::messagesMotDePasse() + [
            'telephone.required' => 'Indiquez votre numéro de téléphone.',
            'telephone.regex' => 'Ce numéro n\'est pas un numéro ivoirien valide.',
            'code.required' => 'Saisissez le code reçu.',
            'code.digits' => 'Le code comporte :digits chiffres.',
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
