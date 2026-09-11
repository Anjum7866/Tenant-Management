<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenantA = Tenant::factory()->create(['name' => 'Tenant A']);
        $tenantB = Tenant::factory()->create(['name' => 'Tenant B']);

        User::factory()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Tenant A Admin',
            'email' => 'admin@tenant-a.test',
            'password' => Hash::make('password'),
        ]);

        User::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Tenant B Admin',
            'email' => 'admin@tenant-b.test',
            'password' => Hash::make('password'),
        ]);

        Property::factory()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Sunrise Apartments',
            'property_type' => 'Apartment',
            'address' => '15 Lakeview Road',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'zip_code' => '411001',
            'description' => 'Corporate-friendly apartment complex with premium amenities.',
            'status' => 'active',
        ]);

        Property::factory()->create([
            'tenant_id' => $tenantA->id,
            'name' => 'Harbor Residences',
            'property_type' => 'Villa',
            'address' => '28 Bayview Avenue',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
            'zip_code' => '400001',
            'description' => 'Luxury residences near the waterfront.',
            'status' => 'active',
        ]);

        Property::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Oakwood Townhomes',
            'property_type' => 'House',
            'address' => '9 Palm Grove',
            'city' => 'Goa',
            'state' => 'Goa',
            'zip_code' => '403001',
            'description' => 'Townhomes designed for long-term residential leasing.',
            'status' => 'active',
        ]);

        Property::factory()->create([
            'tenant_id' => $tenantB->id,
            'name' => 'Pinecrest Homes',
            'property_type' => 'Commercial',
            'address' => '12 Ridge Road',
            'city' => 'Shimla',
            'state' => 'Himachal Pradesh',
            'zip_code' => '171001',
            'description' => 'Mixed-use commercial and residential property portfolio.',
            'status' => 'inactive',
        ]);
    }
}
