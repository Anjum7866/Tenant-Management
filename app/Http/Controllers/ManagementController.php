<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ManagementController extends Controller
{
    public function index(Request $request, string $resource): JsonResponse
    {
        $this->assertResource($resource);
        $user = $request->user();
        $query = $this->queryFor($resource, $user);

        if ($resource === 'tenants') {
            $query->where('role', 'tenant')->select(['id', 'tenant_id', 'name', 'email', 'role', 'created_at']);
        }

        return response()->json(['data' => $query->orderByDesc($this->tableFor($resource).'.created_at')->paginate(20)]);
    }

    public function show(Request $request, string $resource, int $id): JsonResponse
    {
        $this->assertResource($resource);
        $record = $this->queryFor($resource, $request->user())->where($this->tableFor($resource).'.id', $id)->firstOrFail();

        return response()->json(['data' => $record]);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $this->assertResource($resource);
        $user = $request->user();

        if ($resource === 'tenants') {
            abort_unless($user->isSuperAdmin() || $user->role === 'property_manager', 403);
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
                'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id'],
            ]);
            $record = DB::table('users')->insertGetId([
                'tenant_id' => $user->isSuperAdmin() ? $data['tenant_id'] : $user->tenant_id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'tenant',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['id' => $record], 201);
        }

        if (in_array($resource, ['units', 'leases', 'payments', 'maintenance'], true)) {
            $canManage = $user->isSuperAdmin() || $user->role === 'property_manager';
            abort_unless($canManage || ($resource === 'maintenance' && $user->isTenantUser()), 403);

            if ($resource === 'units') {
                $data = $request->validate(['property_id' => ['required', 'integer', 'exists:properties,id'], 'unit_number' => ['required', 'string', 'max:50'], 'floor' => ['nullable', 'integer'], 'bedrooms' => ['required', 'integer', 'min:0'], 'bathrooms' => ['required', 'integer', 'min:0'], 'monthly_rent' => ['required', 'numeric', 'min:0'], 'status' => ['required', Rule::in(['available', 'occupied', 'maintenance'])], 'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id']]);
                $organizationId = $user->tenant_id ?? $data['tenant_id'];
                abort_unless(DB::table('properties')->where('id', $data['property_id'])->where('tenant_id', $organizationId)->exists(), 422, 'The property does not belong to the selected organization.');
                $id = DB::table('units')->insertGetId(array_merge($data, ['tenant_id' => $organizationId, 'created_at' => now(), 'updated_at' => now()]));
            } elseif ($resource === 'leases') {
                $data = $request->validate(['unit_id' => ['required', 'integer', 'exists:units,id'], 'tenant_user_id' => ['required', 'integer', 'exists:users,id'], 'start_date' => ['required', 'date'], 'end_date' => ['required', 'date', 'after:start_date'], 'monthly_rent' => ['required', 'numeric', 'min:0'], 'security_deposit' => ['nullable', 'numeric', 'min:0'], 'status' => ['required', Rule::in(['draft', 'active', 'expired', 'terminated'])], 'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id']]);
                $id = DB::table('leases')->insertGetId(array_merge($data, ['tenant_id' => $user->tenant_id ?? $data['tenant_id'], 'created_at' => now(), 'updated_at' => now()]));
            } elseif ($resource === 'payments') {
                $data = $request->validate(['lease_id' => ['required', 'integer', 'exists:leases,id'], 'tenant_user_id' => ['required', 'integer', 'exists:users,id'], 'amount' => ['required', 'numeric', 'min:0'], 'due_date' => ['required', 'date'], 'paid_date' => ['nullable', 'date'], 'status' => ['required', Rule::in(['pending', 'paid', 'overdue', 'partial'])], 'reference' => ['nullable', 'string', 'max:255'], 'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id']]);
                $id = DB::table('payments')->insertGetId(array_merge($data, ['tenant_id' => $user->tenant_id ?? $data['tenant_id'], 'created_at' => now(), 'updated_at' => now()]));
            } else {
                $data = $request->validate(['property_id' => ['required', 'integer', 'exists:properties,id'], 'unit_id' => ['required', 'integer', 'exists:units,id'], 'title' => ['required', 'string', 'max:255'], 'description' => ['required', 'string'], 'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])], 'status' => ['nullable', Rule::in(['open', 'in_progress', 'resolved', 'closed'])], 'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id']]);
                $id = DB::table('maintenance_requests')->insertGetId(array_merge($data, ['tenant_id' => $user->tenant_id ?? $data['tenant_id'], 'tenant_user_id' => $user->isTenantUser() ? $user->id : $request->integer('tenant_user_id'), 'status' => $data['status'] ?? 'open', 'created_at' => now(), 'updated_at' => now()]));
            }

            return response()->json(['id' => $id], 201);
        }

        if ($resource === 'messages') {
            abort_unless($user->isSuperAdmin() || $user->isTenantUser() || $user->role === 'property_manager', 403);
            $data = $request->validate([
                'body' => ['required', 'string'],
                'recipient_id' => ['nullable', 'integer', 'exists:users,id'],
                'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id'],
            ]);
            $organizationId = $user->tenant_id ?? $data['tenant_id'];
            $id = DB::table('messages')->insertGetId([
                'tenant_id' => $organizationId,
                'sender_id' => $user->id,
                'recipient_id' => $data['recipient_id'] ?? DB::table('users')->where('tenant_id', $user->tenant_id)->where('role', 'property_manager')->value('id'),
                'body' => $data['body'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            abort_unless($user->isSuperAdmin() || $user->isTenantUser(), 403);
            $data = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'type' => ['required', Rule::in(['lease_agreement', 'id_verification', 'property_document', 'payment_receipt', 'other'])],
                'lease_id' => ['nullable', 'integer', 'exists:leases,id'],
                'tenant_id' => [$user->isSuperAdmin() ? 'required' : 'nullable', 'integer', 'exists:tenants,id'],
            ]);
            $organizationId = $user->tenant_id ?? $data['tenant_id'];
            $id = DB::table('documents')->insertGetId([
                'tenant_id' => $organizationId,
                'tenant_user_id' => $user->isTenantUser() ? $user->id : ($request->integer('tenant_user_id') ?: null),
                'lease_id' => $data['lease_id'] ?? null,
                'name' => $data['name'],
                'type' => $data['type'],
                'file_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['id' => $id], 201);
    }

    public function update(Request $request, string $resource, int $id): JsonResponse
    {
        $this->assertResource($resource);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->role === 'property_manager', 403);

        if ($resource === 'tenants') {
            $data = $request->validate(['name' => ['sometimes', 'string', 'max:255'], 'email' => ['sometimes', 'email', 'unique:users,email,'.$id]]);
            DB::table('users')->where('id', $id)->where('role', 'tenant')->where(function ($query) use ($request) {
                if (! $request->user()->isSuperAdmin()) $query->where('tenant_id', $request->user()->tenant_id);
            })->update(array_merge($data, ['updated_at' => now()]));
        } elseif (in_array($resource, ['units', 'leases', 'payments', 'maintenance'], true)) {
            $rules = match ($resource) {
                'units' => ['unit_number' => ['sometimes', 'string', 'max:50'], 'monthly_rent' => ['sometimes', 'numeric', 'min:0'], 'status' => ['sometimes', Rule::in(['available', 'occupied', 'maintenance'])]],
                'leases' => ['start_date' => ['sometimes', 'date'], 'end_date' => ['sometimes', 'date'], 'monthly_rent' => ['sometimes', 'numeric', 'min:0'], 'status' => ['sometimes', Rule::in(['draft', 'active', 'expired', 'terminated'])]],
                'payments' => ['amount' => ['sometimes', 'numeric', 'min:0'], 'paid_date' => ['nullable', 'date'], 'status' => ['sometimes', Rule::in(['pending', 'paid', 'overdue', 'partial'])], 'reference' => ['nullable', 'string']],
                default => ['title' => ['sometimes', 'string', 'max:255'], 'description' => ['sometimes', 'string'], 'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])], 'status' => ['sometimes', Rule::in(['open', 'in_progress', 'resolved', 'closed'])], 'resolution_notes' => ['nullable', 'string']],
            };
            $data = $request->validate($rules);
            $query = DB::table($this->tableFor($resource))->where('id', $id);
            if (! $request->user()->isSuperAdmin()) $query->where($this->tableFor($resource).'.tenant_id', $request->user()->tenant_id);
            $query->update(array_merge($data, ['updated_at' => now()]));
        } else {
            $data = $request->validate(['name' => ['sometimes', 'string', 'max:255'], 'body' => ['sometimes', 'string']]);
            $table = $resource === 'messages' ? 'messages' : 'documents';
            $query = DB::table($table)->where('id', $id);
            if (! $request->user()->isSuperAdmin()) $query->where('tenant_id', $request->user()->tenant_id);
            $query->update(array_merge($data, ['updated_at' => now()]));
        }

        return response()->json(['message' => 'Updated successfully.']);
    }

    public function destroy(Request $request, string $resource, int $id): JsonResponse
    {
        $this->assertResource($resource);
        abort_unless($request->user()->isSuperAdmin() || $request->user()->role === 'property_manager', 403);
        $table = $this->tableFor($resource);
        $query = DB::table($table)->where('id', $id);
        if (! $request->user()->isSuperAdmin()) $query->where('tenant_id', $request->user()->tenant_id);
        $query->delete();
        return response()->json(null, 204);
    }

    private function queryFor(string $resource, $user)
    {
        $table = $this->tableFor($resource);
        $query = DB::table($table);
        if ($resource === 'units') $query->leftJoin('properties', 'properties.id', '=', 'units.property_id')->select('units.*', 'properties.name as property_name');
        if ($resource === 'leases') $query->join('units', 'units.id', '=', 'leases.unit_id')->join('properties', 'properties.id', '=', 'units.property_id')->join('users', 'users.id', '=', 'leases.tenant_user_id')->select('leases.*', 'units.unit_number', 'properties.name as property_name', 'users.name as tenant_name');
        if ($resource === 'payments') $query->join('leases', 'leases.id', '=', 'payments.lease_id')->join('users', 'users.id', '=', 'payments.tenant_user_id')->select('payments.*', 'leases.monthly_rent as lease_rent', 'users.name as tenant_name');
        if ($resource === 'maintenance') $query->join('properties', 'properties.id', '=', 'maintenance_requests.property_id')->join('units', 'units.id', '=', 'maintenance_requests.unit_id')->join('users', 'users.id', '=', 'maintenance_requests.tenant_user_id')->select('maintenance_requests.*', 'properties.name as property_name', 'units.unit_number', 'users.name as tenant_name');
        if ($resource === 'documents') $query->leftJoin('leases', 'leases.id', '=', 'documents.lease_id')->leftJoin('users', 'users.id', '=', 'documents.tenant_user_id')->select('documents.*', 'leases.monthly_rent as lease_rent', 'users.name as tenant_name');
        if ($resource === 'messages') $query->join('users as senders', 'senders.id', '=', 'messages.sender_id')->join('users as recipients', 'recipients.id', '=', 'messages.recipient_id')->select('messages.*', 'senders.name as sender_name', 'recipients.name as recipient_name');
        if (! $user->isSuperAdmin()) $query->where($table.'.tenant_id', $user->tenant_id);
        if ($resource === 'messages' && $user->isTenantUser()) $query->where(function ($inner) use ($user) {
            $inner->where('sender_id', $user->id)->orWhere('recipient_id', $user->id);
        });
        if ($resource === 'documents' && $user->isTenantUser()) $query->where('tenant_user_id', $user->id);
        return $query;
    }

    private function tableFor(string $resource): string
    {
        return $resource === 'tenants' ? 'users' : ($resource === 'maintenance' ? 'maintenance_requests' : $resource);
    }

    private function assertResource(string $resource): void
    {
        abort_unless(in_array($resource, ['tenants', 'units', 'leases', 'payments', 'maintenance', 'documents', 'messages'], true), 404);
    }
}
