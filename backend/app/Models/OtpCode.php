<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['telephone', 'canal', 'code_hash', 'tentatives', 'expire_le', 'utilise_le'])]
#[Hidden(['code_hash'])]
class OtpCode extends Model
{
    protected function casts(): array
    {
        return [
            'expire_le' => 'datetime',
            'utilise_le' => 'datetime',
        ];
    }

    /** Codes encore utilisables : ni consommés, ni expirés. */
    public function scopeValides(Builder $query): void
    {
        $query->whereNull('utilise_le')->where('expire_le', '>', now());
    }
}
