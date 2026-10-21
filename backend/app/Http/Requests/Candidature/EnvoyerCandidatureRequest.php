<?php

namespace App\Http\Requests\Candidature;

use App\Models\Candidature;
use App\Services\AnalyseurBesoin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * « Devenir prestataire » : le dossier envoyé à l'équipe TerraClick. Les pièces et les
 * informations demandées dépendent du type (config/candidature.php).
 */
class EnvoyerCandidatureRequest extends FormRequest
{
    private const FICHIER = ['file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'];

    public function rules(): array
    {
        $type = $this->input('type');
        // Les services de dépannage ouverts ; le pressing a son propre type.
        $services = array_diff(array_keys(app(AnalyseurBesoin::class)->secteursOuverts()), ['pressing']);

        $regles = [
            'type' => ['required', Rule::in(array_keys(config('candidature.types')))],
            'nom_activite' => ['required', 'string', 'min:2', 'max:120'],
            'responsable' => ['required', 'string', 'min:3', 'max:120'],
            'secteurs' => [Rule::requiredIf($type !== 'pressing'), 'nullable', 'array', 'max:5'],
            'secteurs.*' => [Rule::in($services)],
            'quartier_id' => ['required', 'integer', 'exists:quartiers,id'],
            'quartiers' => ['required', 'array', 'min:1', 'max:40'],
            'quartiers.*' => ['integer', 'exists:quartiers,id'],
            'description' => ['required', 'string', 'min:20', 'max:1000'],
            'experience_annees' => ['nullable', 'integer', 'min:0', 'max:60'],
            'horaires' => ['required', 'string', 'max:160'],
            'prix' => ['nullable', 'string', 'max:160'],
            'paiements' => ['required', 'array', 'min:1'],
            'paiements.*' => [Rule::in(array_keys(config('candidature.paiements')))],
            'engagement' => ['accepted'],
            'documents' => ['required', 'array'],
        ];

        // Ce qui est propre au type.
        $regles += match ($type) {
            'artisan' => [
                'details.reference_nom' => ['required', 'string', 'min:3', 'max:120'],
                'details.reference_telephone' => ['required', 'string', 'regex:/^[\d\s+]{8,20}$/'],
            ],
            'entreprise' => [
                'details.rccm' => ['required', 'string', 'max:40'],
                'details.ncc' => ['required', 'string', 'max:40'],
                'details.adresse_siege' => ['required', 'string', 'max:160'],
                'details.nombre_techniciens' => ['required', 'integer', 'min:1', 'max:500'],
            ],
            'pressing' => [
                'details.adresse_local' => ['required', 'string', 'max:160'],
                'details.services' => ['required', 'array', 'min:1'],
                'details.services.*' => [Rule::in(array_keys(config('pressing.services')))],
                'details.express' => ['required', 'boolean'],
                'details.delai' => ['required', 'string', 'max:60'],
                'details.collecte' => ['required', 'boolean'],
                'details.quartiers_collecte' => [Rule::requiredIf($this->boolean('details.collecte')), 'nullable', 'array'],
                'details.quartiers_collecte.*' => ['integer', 'exists:quartiers,id'],
                'details.frais_collecte' => ['nullable', 'string', 'max:60'],
            ],
            default => [],
        };

        // Pièces : obligatoires ou facultatives selon le type ; aucune autre n'est acceptée.
        if (isset(config('candidature.types')[$type])) {
            foreach (Candidature::documentsPour($type) as $cle => [, $obligatoire]) {
                $regles["documents.{$cle}"] = [$obligatoire ? 'required' : 'nullable', ...self::FICHIER];
            }
        }

        return $regles;
    }

    public function messages(): array
    {
        $messages = [
            'type.required' => 'Choisissez le type de prestataire.',
            'nom_activite.required' => 'Indiquez le nom de votre activité.',
            'responsable.required' => 'Indiquez le nom du responsable.',
            'secteurs.required' => 'Choisissez au moins un service.',
            'quartier_id.required' => 'Indiquez votre quartier.',
            'quartiers.required' => 'Choisissez au moins un quartier d\'intervention.',
            'description.required' => 'Décrivez votre activité.',
            'description.min' => 'Décrivez votre activité en une ou deux phrases (20 caractères au moins).',
            'horaires.required' => 'Indiquez vos horaires.',
            'paiements.required' => 'Choisissez au moins un moyen de paiement.',
            'engagement.accepted' => 'Confirmez que les informations sont exactes.',
            'details.reference_nom.required' => 'Indiquez une personne de référence.',
            'details.reference_telephone.required' => 'Indiquez le numéro de la personne de référence.',
            'details.rccm.required' => 'Indiquez le numéro RCCM.',
            'details.ncc.required' => 'Indiquez le numéro de compte contribuable (NCC).',
            'details.adresse_siege.required' => 'Indiquez l\'adresse du siège.',
            'details.nombre_techniciens.required' => 'Indiquez le nombre de techniciens.',
            'details.adresse_local.required' => 'Indiquez l\'adresse du pressing.',
            'details.services.required' => 'Choisissez au moins un service de pressing.',
            'details.delai.required' => 'Indiquez votre délai habituel.',
            'details.quartiers_collecte.required' => 'Choisissez les quartiers où vous collectez.',
            'documents.*.mimes' => 'Envoyez une photo ou un PDF.',
            'documents.*.max' => 'Chaque fichier doit peser moins de 5 Mo.',
        ];

        $type = $this->input('type');
        if (isset(config('candidature.types')[$type])) {
            foreach (Candidature::documentsPour($type) as $cle => [$libelle]) {
                $messages["documents.{$cle}.required"] = "Ajoutez : {$libelle}.";
            }
        }

        return $messages;
    }
}
