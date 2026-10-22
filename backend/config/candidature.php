<?php

/*
| « Devenir prestataire » : ce que chaque type de prestataire fournit pour être vérifié par
| l'équipe TerraClick. Le formulaire de l'application et la validation de l'API lisent cette
| même liste. À valider côté produit (et, pour les obligations légales, auprès de la Chambre
| des Métiers ou du CEPICI).
|
| `documents` : clé => [libellé, obligatoire ?, aide]. Formats acceptés : photo ou PDF, 5 Mo.
*/

return [

    'types' => [
        'artisan' => [
            'nom' => 'Artisan indépendant',
            'detail' => 'Plombier, électricien, climaticien, serrurier ou menuisier à votre compte.',
            'icone' => 'wrench',
        ],
        'entreprise' => [
            'nom' => 'Entreprise',
            'detail' => 'Société ou entreprise immatriculée, avec une équipe de techniciens.',
            'icone' => 'building-2',
        ],
        'pressing' => [
            'nom' => 'Pressing',
            'detail' => 'Lavage, repassage, nettoyage à sec, avec ou sans collecte à domicile.',
            'icone' => 'shirt',
        ],
    ],

    // Pièces communes à tous : identité du responsable.
    'documents_communs' => [
        'photo_visage' => ['Photo de votre visage', true, 'Une photo nette, de face : elle rassure les clients.'],
        'piece_recto' => ['Pièce d\'identité, recto', true, 'CNI, passeport ou carte consulaire.'],
        'piece_verso' => ['Pièce d\'identité, verso', true, null],
    ],

    'documents' => [
        'artisan' => [
            'carte_artisan' => ['Carte professionnelle d\'artisan', false, 'Délivrée par la Chambre des Métiers, si vous l\'avez.'],
            'diplome' => ['Diplôme ou attestation de formation', false, 'CAP, BT, certificat de formation…'],
            'casier' => ['Extrait de casier judiciaire', false, 'Conseillé aux serruriers : vous ouvrez les portes des maisons.'],
            'realisation_1' => ['Photo d\'une réalisation', false, null],
            'realisation_2' => ['Photo d\'une réalisation', false, null],
            'realisation_3' => ['Photo d\'une réalisation', false, null],
        ],
        'entreprise' => [
            'rccm' => ['Registre de commerce (RCCM)', true, null],
            'logo' => ['Logo de l\'entreprise', false, null],
            'attestation_fiscale' => ['Attestation de régularité fiscale', false, null],
            'cnps' => ['Attestation d\'affiliation CNPS', false, null],
            'assurance_rc' => ['Assurance responsabilité civile professionnelle', false, null],
            'assurance_decennale' => ['Assurance décennale', false, 'Seulement pour la construction ou la rénovation lourde.'],
        ],
        'pressing' => [
            'devanture' => ['Photo de la devanture du pressing', true, null],
            'rccm' => ['Registre de commerce (RCCM)', false, 'Si votre pressing est immatriculé.'],
        ],
    ],

    // Métier affiché sur la fiche créée à la validation, selon les services choisis.
    'metiers' => [
        'plomberie' => 'Plombier',
        'electricite' => 'Électricien',
        'climatisation' => 'Climaticien',
        'serrurerie' => 'Serrurier',
        'menuiserie' => 'Menuisier',
        'pressing' => 'Pressing',
    ],

    // Moyens de paiement que le prestataire accepte.
    'paiements' => [
        'especes' => 'Espèces',
        'mobile_money' => 'Mobile Money',
        'carte' => 'Carte bancaire',
        'virement' => 'Virement',
    ],

    'statuts' => [
        'en_attente' => 'En cours de vérification',
        'validee' => 'Validée',
        'refusee' => 'À compléter',
        'rejetee' => 'Rejetée',
    ],

];
