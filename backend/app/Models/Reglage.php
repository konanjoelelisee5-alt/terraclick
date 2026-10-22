<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Un réglage de la plateforme (commission, négociation, moyens de paiement…), changé par l'administrateur. */
#[Fillable(['cle', 'valeur'])]
class Reglage extends Model
{
    protected $primaryKey = 'cle';

    public $incrementing = false;

    protected $keyType = 'string';

    private const CACHE = 'reglages';

    protected function casts(): array
    {
        return ['valeur' => 'json'];
    }

    /** Valeur d'un réglage, sinon sa valeur par défaut (config/finances.php). */
    public static function lire(string $cle): mixed
    {
        $tous = Cache::rememberForever(self::CACHE, fn () => self::query()->pluck('valeur', 'cle')->all());

        return array_key_exists($cle, $tous) ? $tous[$cle] : config("finances.defauts.{$cle}");
    }

    public static function ecrire(string $cle, mixed $valeur): void
    {
        self::query()->updateOrCreate(['cle' => $cle], ['valeur' => $valeur]);
        Cache::forget(self::CACHE);
    }

    /** @return array<string, mixed> tous les réglages, valeurs par défaut comprises */
    public static function tous(): array
    {
        return collect(array_keys(config('finances.defauts')))->mapWithKeys(fn (string $c) => [$c => self::lire($c)])->all();
    }

    /** @return list<string> moyens de paiement proposés aux clients */
    public static function paiements(): array
    {
        return array_values(array_intersect(array_keys(config('finances.moyens')), (array) self::lire('paiements')));
    }
}
