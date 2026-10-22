<?php

namespace App\Policies;

use App\Models\Prestataire;
use App\Models\User;

/** Gestion des fiches par l'équipe : dossier, statut, secteurs, documents, sanctions, mise en avant. */
class PrestatairePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->peut('prestataires.voir');
    }

    public function suspendre(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.suspendre');
    }

    public function mettreEnAvant(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.mettre_en_avant');
    }

    public function view(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.voir');
    }

    /** Attribuer les secteurs, vérifier les documents. */
    public function modifier(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.modifier');
    }

    public function sanctionner(User $user, Prestataire $prestataire): bool
    {
        return $user->peut('prestataires.sanctionner');
    }

    /**
     * Passer à un statut. Bloquer, ou sortir d'un blocage, demande la permission de bloquer ;
     * suspendre ou réactiver, celle de suspendre.
     */
    public function changerStatut(User $user, Prestataire $prestataire, string $statut): bool
    {
        return $statut === 'bloque' || $prestataire->statut === 'bloque'
            ? $user->peut('prestataires.bloquer')
            : $user->peut('prestataires.suspendre');
    }
}
