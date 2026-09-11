<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->randomElement([
                'Sunrise Apartments',
                'Harbor Residences',
                'Willow Townhomes',
                'Oakwood Villas',
                'Pinecrest Homes',
            ]),
            'property_type' => fake()->randomElement(['Apartment', 'House', 'Commercial', 'Villa', 'Other']),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'zip_code' => fake()->postcode(),
            'description' => fake()->sentence(),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
