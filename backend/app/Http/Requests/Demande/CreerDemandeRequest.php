<?php

namespace App\Http\Requests\Demande;

use App\Models\Demande;
use App\Services\AnalyseurBesoin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Envoi d'une demande, à la fin de l'assistant de besoin (« Confirmer ma demande »). */
class CreerDemandeRequest extends FormRequest
{
    public const AUTRE = 'Autre';

    public function rules(): array
    {
        $secteurs = app(AnalyseurBesoin::class)->secteursOuverts();
        $problemes = [...($secteurs[$this->input('secteur')]['problemes'] ?? []), self::AUTRE];

        return [
            'secteur' => ['required', 'string', Rule::in(array_keys($secteurs))],
            'probleme' => ['required', 'string', Rule::in($problemes)],
            // « Autre » : le client décrit lui-même son problème.
            'precision' => ['nullable', 'string', 'max:500', Rule::requiredIf($this->input('probleme') === self::AUTRE)],
            'quartier_id' => ['required', 'integer', 'exists:quartiers,id'],
            'repere' => ['nullable', 'string', 'max:160'],
            'quand' => ['required', Rule::in(Demande::QUAND)],
            'date_souhaitee' => ['nullable', 'required_if:quand,date', 'date', 'after_or_equal:today'],
            'mode' => ['required', Rule::in(Demande::MODES)],
            'prestataire_id' => ['nullable', 'integer', 'exists:prestataires,id'],
            'paiement' => ['required', Rule::in(Demande::PAIEMENTS)],
            'photos' => ['nullable', 'array', 'max:3'],
            'photos.*' => ['image', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'secteur.in' => 'Ce service n\'est pas encore proposé.',
            'probleme.in' => 'Choisissez le problème dans la liste, ou « Autre ».',
            'precision.required' => 'Décrivez votre problème en quelques mots.',
            'quartier_id.required' => 'Indiquez votre quartier.',
            'quand.required' => 'Dites-nous quand vous avez besoin du technicien.',
            'date_souhaitee.required_if' => 'Choisissez une date.',
            'date_souhaitee.after_or_equal' => 'La date ne peut pas être passée.',
            'paiement.required' => 'Choisissez comment vous paierez le technicien.',
            'photos.max' => 'Trois photos au plus.',
            'photos.*.image' => 'Seules les photos sont acceptées.',
            'photos.*.max' => 'Chaque photo doit peser moins de 5 Mo.',
        ];
    }
}
