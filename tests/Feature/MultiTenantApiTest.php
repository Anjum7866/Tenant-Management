<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
