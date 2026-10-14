<?php

namespace App\Support;

/**
 * Numéros ivoiriens : 10 chiffres depuis 2021, préfixés 01 (Moov), 05 (MTN),
 * 07 (Orange) ou 21/25/27 (fixe). Stockés au format +225XXXXXXXXXX.
 */
class Telephone
{
    public const FORMAT = '/^\+225(01|05|07|21|25|27)\d{8}$/';

    /** Retourne le numéro normalisé, ou null s'il n'est pas reconnaissable. */
    public static function normaliser(?string $saisie): ?string
    {
        $chiffres = preg_replace('/\D/', '', (string) $saisie);

        if (strlen($chiffres) === 15 && str_starts_with($chiffres, '00225')) {
            $chiffres = substr($chiffres, 5);
        } elseif (strlen($chiffres) === 13 && str_starts_with($chiffres, '225')) {
            $chiffres = substr($chiffres, 3);
        }

        $numero = '+225'.$chiffres;

        return preg_match(self::FORMAT, $numero) ? $numero : null;
    }

    /** +2250758421903 → 07 58 42 19 03 */
    public static function affichage(string $numero): string
    {
        return trim(chunk_split(substr($numero, 4), 2, ' '));
    }
}
