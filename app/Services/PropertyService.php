<?php

namespace App\Services;

use App\Models\Property;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class PropertyService
{
    public function listProperties(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Property::query()
            ->when(! $user->isSuperAdmin(), fn ($query) => $query->where('tenant_id', $user->tenant_id))
            ->when(! empty($filters['search']), function ($query) use ($filters) {
                $query->where(function ($inner) use ($filters) {
                    $inner->where('name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('city', 'like', '%'.$filters['search'].'%')
                        ->orWhere('state', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when(! empty($filters['city']), function ($query) use ($filters) {
                $query->where('city', 'like', '%'.$filters['city'].'%');
            })
            ->when(! empty($filters['status']), function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            });

        return $query->orderByDesc('created_at')->paginate(10);
    }

    public function createProperty(User $user, array $data): Property
    {
        return Property::create([
            'tenant_id' => $user->tenant_id,
            'name' => $data['name'],
            'property_type' => $data['property_type'],
            'address' => $data['address'],
            'city' => $data['city'],
            'state' => $data['state'],
            'zip_code' => $data['zip_code'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'],
        ]);
    }

    public function updateProperty(User $user, Property $property, array $data): Property
    {
        if ($user->role !== 'property_manager' || $property->tenant_id !== $user->tenant_id) {
            abort(404);
        }

        $property->update($data);

        return $property->fresh();
    }

    public function deleteProperty(User $user, Property $property): void
    {
        if ($user->role !== 'property_manager' || $property->tenant_id !== $user->tenant_id) {
            abort(404);
        }

        $property->delete();
    }
}
