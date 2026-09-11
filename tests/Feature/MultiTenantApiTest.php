<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MultiTenantApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_receive_tenant_context(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Tenant A']);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@tenant-a.test',
            'password' => 'password',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@tenant-a.test',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'admin@tenant-a.test')
            ->assertJsonPath('user.tenant.id', $tenant->id)
            ->assertJsonPath('user.tenant.name', 'Tenant A');

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_user_can_only_list_properties_from_their_tenant(): void
    {
        $tenantA = Tenant::factory()->create(['name' => 'Tenant A']);
        $tenantB = Tenant::factory()->create(['name' => 'Tenant B']);

        $user = User::factory()->create(['tenant_id' => $tenantA->id]);

        Property::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'Sunrise Apartments']);
        Property::factory()->create(['tenant_id' => $tenantA->id, 'name' => 'Harbor Residences']);
        Property::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'Other Tenant Property']);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/properties');

        $response->assertOk();
        $this->assertCount(2, $response->json('data'));
        $this->assertEqualsCanonicalizing(
            ['Harbor Residences', 'Sunrise Apartments'],
            collect($response->json('data'))->pluck('name')->sort()->values()->all(),
        );
    }

    public function test_user_cannot_access_other_tenant_property(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenantA->id]);
        $property = Property::factory()->create(['tenant_id' => $tenantB->id, 'name' => 'Restricted Property']);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/properties/'.$property->id);

        $response->assertNotFound();
    }

    public function test_user_cannot_create_a_property_for_another_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/properties', [
            'tenant_id' => 999,
            'name' => 'Riverfront Homes',
            'property_type' => 'Apartment',
            'address' => '22 Oak Avenue',
            'city' => 'Pune',
            'state' => 'Maharashtra',
            'zip_code' => '411001',
            'description' => 'Managed residential property',
            'status' => 'active',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('properties', [
            'tenant_id' => $tenant->id,
            'name' => 'Riverfront Homes',
        ]);
    }

    public function test_dashboard_is_role_aware_and_tenant_users_only_see_assigned_records(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $manager = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'property_manager']);
        $tenantUser = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'tenant']);
        $superAdmin = User::factory()->create(['tenant_id' => null, 'role' => 'super_admin']);
        $propertyA = Property::factory()->create(['tenant_id' => $tenantA->id]);
        Property::factory()->create(['tenant_id' => $tenantB->id]);
        $unitId = DB::table('units')->insertGetId([
            'tenant_id' => $tenantA->id,
            'property_id' => $propertyA->id,
            'unit_number' => 'A-101',
            'floor' => 1,
            'bedrooms' => 1,
            'bathrooms' => 1,
            'monthly_rent' => 15000,
            'status' => 'occupied',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('leases')->insert([
            'tenant_id' => $tenantA->id,
            'unit_id' => $unitId,
            'tenant_user_id' => $tenantUser->id,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'monthly_rent' => 15000,
            'security_deposit' => 30000,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($tenantUser, 'sanctum');
        $tenantResponse = $this->getJson('/api/dashboard');
        $tenantResponse->assertOk()
            ->assertJsonPath('role', 'tenant')
            ->assertJsonPath('stats.properties', 1)
            ->assertJsonPath('stats.units', 1);

        $this->actingAs($manager, 'sanctum');
        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'property_manager')
            ->assertJsonPath('stats.properties', 1);

        $this->actingAs($superAdmin, 'sanctum');
        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'super_admin')
            ->assertJsonPath('stats.properties', 2);

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_units_include_their_property_relationship_for_managers(): void
    {
        $tenant = Tenant::factory()->create();
        $manager = User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'property_manager']);
        $property = Property::factory()->create(['tenant_id' => $tenant->id, 'name' => 'Linked Property']);
        DB::table('units')->insert([
            'tenant_id' => $tenant->id,
            'property_id' => $property->id,
            'unit_number' => 'A-101',
            'floor' => 1,
            'bedrooms' => 1,
            'bathrooms' => 1,
            'monthly_rent' => 15000,
            'status' => 'available',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($manager, 'sanctum');

        $this->getJson('/api/units')
            ->assertOk()
            ->assertJsonPath('data.data.0.property_name', 'Linked Property')
            ->assertJsonPath('data.data.0.unit_number', 'A-101');
    }
}
