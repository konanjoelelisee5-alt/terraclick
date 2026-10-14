<?php

namespace App\Exceptions;

use RuntimeException;

/** Un fournisseur n'a pas pu transmettre le code (service injoignable, refus, configuration). */
class EnvoiCodeImpossible extends RuntimeException {}
