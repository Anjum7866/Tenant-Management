<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'property_manager';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'property_type' => ['required', Rule::in(['Apartment', 'House', 'Commercial', 'Villa', 'Other'])],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'state' => ['required', 'string', 'max:120'],
            'zip_code' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
