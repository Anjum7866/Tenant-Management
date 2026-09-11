<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
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

        $superAdmin = User::factory()->create([
            'tenant_id' => null,
            'role' => 'super_admin',
            'name' => 'System Super Admin',
            'email' => 'superadmin@tms.test',
            'password' => Hash::make('superadmin123'),
        ]);

        $managerA = User::factory()->create([
            'tenant_id' => $tenantA->id,
            'role' => 'property_manager',
            'name' => 'Tenant A Manager',
            'email' => 'manager@tenant-a.test',
            'password' => Hash::make('manager123'),
        ]);

        User::factory()->create([
            'tenant_id' => $tenantA->id,
            'role' => 'tenant',
            'name' => 'Aarav Sharma',
            'email' => 'tenant@tenant-a.test',
            'password' => Hash::make('tenant123'),
        ]);

        $managerB = User::factory()->create([
            'tenant_id' => $tenantB->id,
            'role' => 'property_manager',
            'name' => 'Tenant B Manager',
            'email' => 'manager@tenant-b.test',
            'password' => Hash::make('manager123'),
        ]);

        User::factory()->create([
            'tenant_id' => $tenantB->id,
            'role' => 'tenant',
            'name' => 'Meera Iyer',
            'email' => 'tenant@tenant-b.test',
            'password' => Hash::make('tenant123'),
        ]);

        $propertyA = Property::factory()->create([
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

        $propertyA2 = Property::factory()->create([
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

        $propertyB = Property::factory()->create([
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

        $propertyB2 = Property::factory()->create([
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

        $tenantUserA = User::where('email', 'tenant@tenant-a.test')->firstOrFail();
        $tenantUserB = User::where('email', 'tenant@tenant-b.test')->firstOrFail();

        $unitA = DB::table('units')->insertGetId([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'unit_number' => 'A-102',
            'floor' => 1,
            'bedrooms' => 2,
            'bathrooms' => 2,
            'monthly_rent' => 25000,
            'status' => 'occupied',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('units')->insert([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'unit_number' => 'A-103',
            'floor' => 1,
            'bedrooms' => 1,
            'bathrooms' => 1,
            'monthly_rent' => 18000,
            'status' => 'available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $unitB = DB::table('units')->insertGetId([
            'tenant_id' => $tenantB->id,
            'property_id' => $propertyB->id,
            'unit_number' => 'B-201',
            'floor' => 2,
            'bedrooms' => 2,
            'bathrooms' => 2,
            'monthly_rent' => 30000,
            'status' => 'occupied',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $leaseA = DB::table('leases')->insertGetId([
            'tenant_id' => $tenantA->id,
            'unit_id' => $unitA,
            'tenant_user_id' => $tenantUserA->id,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'monthly_rent' => 25000,
            'security_deposit' => 50000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $leaseB = DB::table('leases')->insertGetId([
            'tenant_id' => $tenantB->id,
            'unit_id' => $unitB,
            'tenant_user_id' => $tenantUserB->id,
            'start_date' => '2026-02-01',
            'end_date' => '2027-01-31',
            'monthly_rent' => 30000,
            'security_deposit' => 60000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('payments')->insert([
            [
                'tenant_id' => $tenantA->id,
                'lease_id' => $leaseA,
                'tenant_user_id' => $tenantUserA->id,
                'amount' => 25000,
                'due_date' => '2026-09-05',
                'paid_date' => '2026-09-04',
                'status' => 'paid',
                'reference' => 'PAY-A-0904',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenantB->id,
                'lease_id' => $leaseB,
                'tenant_user_id' => $tenantUserB->id,
                'amount' => 30000,
                'due_date' => '2026-09-05',
                'paid_date' => null,
                'status' => 'overdue',
                'reference' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('maintenance_requests')->insert([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'unit_id' => $unitA,
            'tenant_user_id' => $tenantUserA->id,
            'title' => 'Air conditioner not working',
            'description' => 'The bedroom AC is not cooling properly.',
            'priority' => 'high',
            'status' => 'in_progress',
            'resolution_notes' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('maintenance_requests')->insert([
            'tenant_id' => $tenantB->id,
            'property_id' => $propertyB->id,
            'unit_id' => $unitB,
            'tenant_user_id' => $tenantUserB->id,
            'title' => 'Bathroom leakage',
            'description' => 'Water is leaking under the bathroom sink.',
            'priority' => 'medium',
            'status' => 'resolved',
            'resolution_notes' => 'Replaced the damaged pipe fitting.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('documents')->insert([
            ['tenant_id' => $tenantA->id, 'tenant_user_id' => $tenantUserA->id, 'lease_id' => $leaseA, 'name' => 'Aarav Lease Agreement', 'type' => 'lease_agreement', 'file_path' => null, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantB->id, 'tenant_user_id' => $tenantUserB->id, 'lease_id' => $leaseB, 'name' => 'Meera ID Verification', 'type' => 'id_verification', 'file_path' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('messages')->insert([
            ['tenant_id' => $tenantA->id, 'sender_id' => $tenantUserA->id, 'recipient_id' => $managerA->id, 'body' => 'Could you share an update on the AC repair?', 'read_at' => null, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantB->id, 'sender_id' => $managerB->id, 'recipient_id' => $tenantUserB->id, 'body' => 'The bathroom repair has been completed.', 'read_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
