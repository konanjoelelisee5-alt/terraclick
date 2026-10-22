<?php

namespace App\Http\Requests\Demande;

use App\Models\Demande;
use App\Models\Quartier;
use App\Services\AnalyseurBesoin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Envoi d'une demande, à la fin de l'assistant de besoin (« Confirmer ma demande »). */
class CreerDemandeRequest extends FormRequest
{
    public const AUTRE = 'Autre';

    /** Problème d'une demande au pressing composée article par article. */
    public const PACK = 'Pack pressing';

    public function rules(): array
    {
        $secteurs = app(AnalyseurBesoin::class)->secteursOuverts();
        $pack = $this->input('probleme') === self::PACK;
        $problemes = [...($secteurs[$this->input('secteur')]['problemes'] ?? []), self::AUTRE];
        if ($this->input('secteur') === 'pressing') {
            $problemes[] = self::PACK;
        }

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
            // Pack pressing : les articles et leur nombre ; les prix viennent de config/pressing.php.
            'articles' => [Rule::requiredIf($this->input('probleme') === self::PACK), 'nullable', 'array', 'max:30'],
            'articles.*.cle' => ['required', Rule::in(array_keys(config('pressing.articles')))],
            'articles.*.quantite' => ['required', 'integer', 'min:1', 'max:200'],
            // Commande au pressing : service, express, mode de dépôt, heure du créneau, adresse.
            'service' => [Rule::requiredIf($pack), 'nullable', Rule::in(array_keys(config('pressing.services')))],
            'express' => ['nullable', 'boolean'],
            'depot' => [Rule::requiredIf($pack), 'nullable', Rule::in(array_keys(config('pressing.depots')))],
            'heure' => [Rule::requiredIf($pack), 'nullable', Rule::in(config('pressing.heures'))],
            'adresse_libelle' => ['nullable', 'string', 'max:40'],
        ];
    }

    /** Le quartier doit être ouvert, et le service y être proposé. */
    public function after(): array
    {
        return [function ($validator) {
            if ($validator->errors()->has('quartier_id') || $validator->errors()->has('secteur')) {
                return;
            }
            $quartier = Quartier::find($this->integer('quartier_id'));
            if ($quartier && ! $quartier->actif) {
                $validator->errors()->add('quartier_id', 'TerraClick n\'intervient pas encore dans ce quartier.');
            } elseif ($quartier && ! $quartier->proposeSecteur((string) $this->input('secteur'))) {
                $validator->errors()->add('quartier_id', 'Ce service n\'est pas encore proposé dans ce quartier.');
            }
        }];
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
            'articles.required' => 'Ajoutez au moins un article à votre pack.',
            'articles.*.cle.in' => 'Cet article n\'est pas proposé.',
            'articles.*.quantite.min' => 'Indiquez au moins une pièce.',
            'service.required' => 'Choisissez le service : lavage, repassage ou nettoyage à sec.',
            'depot.required' => 'Choisissez la collecte à domicile ou le dépôt au pressing.',
            'heure.required' => 'Choisissez l\'heure du créneau.',
            'heure.in' => 'Choisissez une heure proposée.',
        ];
    }
}
