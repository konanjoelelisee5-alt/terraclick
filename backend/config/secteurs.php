<?php

/*
| Vocabulaire de la barre de recherche. Le client tape un métier (« plombier »), un service
| (« plomberie ») ou décrit son problème (« ma douche fuit depuis hier ») : App\Services\
| AnalyseurBesoin en déduit le secteur, et la recherche porte sur ses catégories.
|
| Les mots sont comparés sans accents ni majuscules ; apostrophes et tirets comptent comme
| des espaces (« l'eau » → « l eau », « chauffe-eau » → « chauffe eau »).
|  - « fuit* » : préfixe, reconnaît fuit, fuite, fuites ;
|  - « lit »   : mot exact, pluriel admis (lits), mais pas « litre » ;
|  - « chasse d eau » : expression de plusieurs mots, cherchée telle quelle.
| Poids : 3 = le métier lui-même, 2 = indice net, 1 = indice faible partagé entre secteurs
| (« porte », « eau », « panne »). À égalité, les secteurs ex æquo sont tous proposés.
|
| `problemes` : les choix de la première question de l'assistant de besoin (« Quel est le
| problème ? »), suivis d'« Autre ». Une recherche qui contient l'un d'eux le présélectionne
| (« fuite d'eau dans la cuisine » → « Fuite d'eau »).
|
| Pour rouvrir un secteur masqué du MVP, ajoutez-le ici en plus de config/mvp.php.
*/

return [

    'plomberie' => [
        'nom' => 'Plomberie',
        'categories' => ['plombiers', 'entretien-plomberie'],
        'problemes' => ['Fuite d\'eau', 'WC bouché', 'Robinet cassé', 'Canalisation bouchée', 'Chauffe-eau en panne'],
        'mots' => [
            'plomb*' => 3, 'sanitaire*' => 3,
            'fuit*' => 2, 'fuyant*' => 2, 'robinet*' => 2, 'evier*' => 2, 'lavabo*' => 2, 'douche*' => 2,
            'baignoire*' => 2, 'wc' => 2, 'toilette*' => 2, 'chasse d eau' => 2, 'canalisation*' => 2,
            'tuyau*' => 2, 'debouch*' => 2, 'bouch*' => 2, 'siphon*' => 2, 'chauffe eau' => 2,
            'ballon d eau' => 2, 'pompe*' => 2, 'surpresseur*' => 2, 'fosse septique' => 2, 'egout*' => 2,
            'inond*' => 2, 'compteur d eau' => 2, 'sodeci' => 2, 'pas d eau' => 2,
            'eau' => 1, 'salle de bain' => 1,
        ],
    ],

    'electricite' => [
        'nom' => 'Électricité',
        'categories' => ['electriciens', 'entretien-electricite'],
        'problemes' => ['Panne de courant', 'Disjoncteur qui saute', 'Prise ou interrupteur', 'Éclairage', 'Installation électrique'],
        'mots' => [
            'electri*' => 3,
            'courant' => 2, 'disjonct*' => 2, 'prise' => 2, 'interrupteur*' => 2, 'ampoule*' => 2,
            'lampe*' => 2, 'eclairage*' => 2, 'lumiere*' => 2, 'tableau electrique' => 2, 'cable*' => 2,
            'court circuit' => 2, 'compteur' => 2, 'cie' => 2, 'coupure*' => 2, 'fusible*' => 2,
            'tension' => 2, 'etincel*' => 2, 'branchement*' => 2, 'ventilateur*' => 2,
            'groupe electrogene' => 2, 'onduleur*' => 2, 'fil' => 1, 'panne' => 1,
        ],
    ],

    'climatisation' => [
        'nom' => 'Climatisation',
        'categories' => ['climatisation-vente-et-reparation'],
        'problemes' => ['Clim ne refroidit pas', 'Clim qui coule', 'Entretien ou recharge de gaz', 'Bruit anormal', 'Installation d\'un climatiseur'],
        'mots' => [
            'clim*' => 3, 'frigoriste*' => 3,
            'split*' => 2, 'refroidi*' => 2, 'froid*' => 2, 'recharge de gaz' => 2, 'btu' => 2,
            'condenseur*' => 2, 'frigo*' => 2, 'refrigerateur*' => 2, 'congelateur*' => 2,
            'chambre froide' => 2, 'fait chaud' => 2, 'gaz' => 1, 'chaleur' => 1,
        ],
    ],

    'serrurerie' => [
        'nom' => 'Serrurerie',
        'categories' => ['serruriers'],
        'problemes' => ['Porte bloquée', 'Clé perdue', 'Serrure cassée', 'Changer une serrure', 'Blindage ou sécurité'],
        'mots' => [
            'serrur*' => 3,
            'cle' => 2, 'clef' => 2, 'verrou*' => 2, 'cadenas' => 2, 'blind*' => 2, 'enferm*' => 2,
            'ferme pas' => 2, 'ferme plus' => 2, 'ouvre pas' => 2, 'ouvre plus' => 2,
            'grille*' => 2, 'portail*' => 2, 'coffre fort' => 2, 'barillet*' => 2, 'cambriol*' => 2,
            'porte' => 1,
        ],
    ],

    'menuiserie' => [
        'nom' => 'Menuiserie',
        'categories' => ['menuisiers'],
        'problemes' => ['Porte ou fenêtre abîmée', 'Réparation de meuble', 'Meuble sur mesure', 'Placard ou dressing', 'Pose de porte ou fenêtre'],
        'mots' => [
            'menuis*' => 3, 'ebenist*' => 3,
            'bois' => 2, 'fenetre*' => 2, 'placard*' => 2, 'armoire*' => 2, 'meuble*' => 2, 'table' => 2,
            'chaise' => 2, 'lit' => 2, 'etagere*' => 2, 'charniere*' => 2, 'persienne*' => 2, 'volet*' => 2,
            'parquet*' => 2, 'faux plafond' => 2, 'dressing*' => 2, 'tiroir*' => 2,
            'porte' => 1,
        ],
    ],

];
