<?php

namespace Tests\Unit;

use App\Support\Montant;
use App\Support\Telephone;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class TelephoneEtMontantTest extends TestCase
{
    public static function numeros(): array
    {
        return [
            'saisie espacée' => ['07 58 42 19 03', '+2250758421903'],
            'indicatif +225' => ['+225 07 58 42 19 03', '+2250758421903'],
            'indicatif 00225' => ['00225 0758421903', '+2250758421903'],
            'Moov' => ['0102030405', '+2250102030405'],
            'MTN avec tirets' => ['05-44-33-22-11', '+2250544332211'],
            'ancien format à 8 chiffres' => ['58 42 19 03', null],
            'préfixe inconnu' => ['09 58 42 19 03', null],
            'trop long' => ['07 58 42 19 03 1', null],
            'vide' => ['', null],
        ];
    }

    #[DataProvider('numeros')]
    public function test_normalisation_des_numeros(string $saisie, ?string $attendu): void
    {
        $this->assertSame($attendu, Telephone::normaliser($saisie));
    }

    public function test_affichage_du_numero(): void
    {
        $this->assertSame('07 58 42 19 03', Telephone::affichage('+2250758421903'));
    }

    public function test_montants_en_francs_cfa(): void
    {
        $this->assertSame('150 000 F', Montant::format(150000));
        $this->assertSame('5 000 – 15 000 F', Montant::fourchette(5000, 15000));
        $this->assertSame('À partir de 150 000 F', Montant::fourchette(150000, null));
        $this->assertNull(Montant::fourchette(null, null));
    }

    public function test_delais_de_reponse(): void
    {
        $this->assertSame('10 min', Montant::delai(10));
        $this->assertSame('1 h', Montant::delai(60));
        $this->assertSame('1 h 30', Montant::delai(90));
        $this->assertSame('2 h 05', Montant::delai(125));
        $this->assertNull(Montant::delai(null));
    }
}
