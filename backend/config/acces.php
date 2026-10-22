<?php

/*
| Rôles et permissions de TerraClick. Chaque interface s'ouvre à une permission : les routes
| la demandent (middleware `permission:…`), les policies la vérifient objet par objet, et
| l'application n'affiche que les modules permis.
|
| Ce fichier est la liste de départ : RolesPermissionsSeeder la recopie en base, où l'écran
| « Rôles et permissions » de l'espace administrateur la fait ensuite évoluer. Le rôle
| `admin` garde toujours toutes les permissions.
*/

return [

    // Permissions, rangées par interface : clé => libellé.
    'permissions' => [
        'Espace client' => [
            'demandes.envoyer' => 'Envoyer des demandes et commandes',
            'onglets.suivre' => 'Suivre ses onglets, noter, signaler',
        ],
        'Espace prestataire' => [
            'pro.acceder' => 'Ouvrir l\'espace prestataire',
            'pro.demandes' => 'Recevoir et traiter les demandes reçues',
        ],
        'Espace administrateur' => [
            'admin.acceder' => 'Ouvrir l\'espace administrateur',
            'admin.apercu' => 'Voir la vue d\'ensemble',
            'admin.activite' => 'Voir le journal d\'activité',
            'candidatures.voir' => 'Voir les candidatures et leurs pièces',
            'candidatures.traiter' => 'Valider ou faire corriger une candidature',
            'signalements.voir' => 'Voir les signalements',
            'signalements.traiter' => 'Traiter un signalement',
            'demandes.voir_toutes' => 'Voir toutes les demandes et commandes',
            'prestataires.voir' => 'Voir les prestataires',
            'prestataires.suspendre' => 'Suspendre ou réactiver un prestataire',
            'prestataires.mettre_en_avant' => 'Mettre un prestataire en avant',
            'utilisateurs.voir' => 'Voir les utilisateurs',
            'utilisateurs.roles' => 'Changer le rôle d\'un utilisateur',
            'catalogue.prix' => 'Modifier les prix indicatifs',
            'roles.gerer' => 'Gérer les rôles et leurs permissions',
        ],
    ],

    // Rôles de départ : clé => [nom, description, permissions ('*' = toutes)].
    'roles' => [
        'client' => [
            'nom' => 'Client',
            'description' => 'Cherche, envoie des demandes et des commandes, les suit dans ses onglets.',
            'permissions' => ['demandes.envoyer', 'onglets.suivre'],
        ],
        'prestataire' => [
            'nom' => 'Prestataire',
            'description' => 'Technicien ou pressing vérifié : reçoit et traite les demandes de ses clients.',
            'permissions' => ['demandes.envoyer', 'onglets.suivre', 'pro.acceder', 'pro.demandes'],
        ],
        'manager' => [
            'nom' => 'Manager',
            'description' => 'Équipe opérationnelle : vérifie les candidatures, traite les signalements, surveille les demandes et les prestataires.',
            'permissions' => [
                'demandes.envoyer', 'onglets.suivre',
                'admin.acceder', 'admin.apercu', 'admin.activite',
                'candidatures.voir', 'candidatures.traiter',
                'signalements.voir', 'signalements.traiter',
                'demandes.voir_toutes',
                'prestataires.voir', 'prestataires.suspendre',
                'utilisateurs.voir',
            ],
        ],
        'admin' => [
            'nom' => 'Administrateur',
            'description' => 'Accès complet : en plus du manager, les rôles, les prix et la mise en avant.',
            'permissions' => ['*'],
        ],
    ],

    // Rôle donné à chaque nouveau compte.
    'role_par_defaut' => 'client',

];
