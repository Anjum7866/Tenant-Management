<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function __construct(protected PropertyService $propertyService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $properties = $this->propertyService->listProperties(
            $request->user(),
            $request->only(['search', 'city', 'status'])
        );

        return response()->json([
            'data' => PropertyResource::collection($properties),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $property = $this->propertyService->createProperty(
            $request->user(),
            $request->validated()
        );

        return response()->json(new PropertyResource($property), 201);
    }

    public function show(Request $request, Property $property): JsonResponse
    {
        if ($property->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        return response()->json(new PropertyResource($property));
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        if ($property->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        $property = $this->propertyService->updateProperty(
            $request->user(),
            $property,
            $request->validated()
        );

        return response()->json(new PropertyResource($property));
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        if ($property->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }

        $this->propertyService->deleteProperty($request->user(), $property);

        return response()->json(null, 204);
    }
}
