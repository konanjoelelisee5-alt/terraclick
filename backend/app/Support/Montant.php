<?php

namespace App\Support;

/** Montants en F CFA, espace comme séparateur de milliers : 15 000 F. */
class Montant
{
    public static function format(int $montant): string
    {
        return number_format($montant, 0, ',', ' ').' F';
    }

    public static function fourchette(?int $min, ?int $max): ?string
    {
        return match (true) {
            $min !== null && $max !== null => number_format($min, 0, ',', ' ').' – '.self::format($max),
            $min !== null => 'À partir de '.self::format($min),
            $max !== null => 'Jusqu\'à '.self::format($max),
            default => null,
        };
    }

    /** Délai de réponse : 10 min, 1 h, 1 h 30. */
    public static function delai(?int $minutes): ?string
    {
        if ($minutes === null) {
            return null;
        }
        if ($minutes < 60) {
            return $minutes.' min';
        }

        $reste = $minutes % 60;

        return intdiv($minutes, 60).' h'.($reste ? ' '.str_pad((string) $reste, 2, '0', STR_PAD_LEFT) : '');
    }
}
