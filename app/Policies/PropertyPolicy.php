<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function view(User $user, Property $property): bool
    {
        return $user->isSuperAdmin() || $user->tenant_id === $property->tenant_id;
    }

    public function update(User $user, Property $property): bool
    {
        return $user->role === 'property_manager' && $user->tenant_id === $property->tenant_id;
    }

    public function delete(User $user, Property $property): bool
    {
        return $user->role === 'property_manager' && $user->tenant_id === $property->tenant_id;
    }
}
