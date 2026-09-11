<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();
        $tenantId = $user->tenant_id;
        $scope = fn ($query, string $table) => $isSuperAdmin
            ? $query
            : $query->where($table.'.tenant_id', $tenantId);

        $unitQuery = $scope(DB::table('units'), 'units');
        $leaseQuery = $scope(DB::table('leases'), 'leases');
        $paymentQuery = $scope(DB::table('payments'), 'payments');
        $maintenanceQuery = $scope(DB::table('maintenance_requests'), 'maintenance_requests');
        $propertyQuery = $scope(DB::table('properties'), 'properties');
        $userQuery = $isSuperAdmin
            ? DB::table('users')
            : DB::table('users')->where('tenant_id', $tenantId);

        if ($user->isTenantUser()) {
            $assignedUnitIds = DB::table('leases')
                ->select('unit_id')
                ->where('tenant_user_id', $user->id);

            $assignedPropertyIds = DB::table('units')
                ->select('property_id')
                ->whereIn('id', $assignedUnitIds);

            $unitQuery->whereIn('id', $assignedUnitIds);
            $propertyQuery->whereIn('id', $assignedPropertyIds);
            $leaseQuery->where('tenant_user_id', $user->id);
            $paymentQuery->where('tenant_user_id', $user->id);
            $maintenanceQuery->where('tenant_user_id', $user->id);
        }

        $properties = $propertyQuery
            ->select('properties.*')
            ->selectSub(DB::table('units')->selectRaw('count(*)')->whereColumn('units.property_id', 'properties.id'), 'units_count')
            ->selectSub(DB::table('leases')->join('units as property_units', 'property_units.id', '=', 'leases.unit_id')->selectRaw('count(distinct leases.tenant_user_id)')->whereColumn('property_units.property_id', 'properties.id'), 'tenants_count')
            ->orderByDesc('properties.created_at')->limit(8)->get();
        $units = $scope(DB::table('units')->join('properties', 'properties.id', '=', 'units.property_id')->select('units.*', 'properties.name as property_name', 'properties.city as property_city'), 'units')->when($user->isTenantUser(), fn ($query) => $query->whereIn('units.id', $assignedUnitIds))->orderBy('units.property_id')->orderBy('units.unit_number')->limit(20)->get();
        $leases = $scope(DB::table('leases')->join('units', 'units.id', '=', 'leases.unit_id')->join('properties', 'properties.id', '=', 'units.property_id')->join('users as lease_tenants', 'lease_tenants.id', '=', 'leases.tenant_user_id')->select('leases.*', 'units.unit_number', 'properties.name as property_name', 'lease_tenants.name as tenant_name'), 'leases')->when($user->isTenantUser(), fn ($query) => $query->where('leases.tenant_user_id', $user->id))->orderBy('leases.end_date')->limit(8)->get();
        $payments = $scope(DB::table('payments')->join('leases', 'leases.id', '=', 'payments.lease_id')->join('users as payment_tenants', 'payment_tenants.id', '=', 'payments.tenant_user_id')->select('payments.*', 'leases.monthly_rent as lease_rent', 'payment_tenants.name as tenant_name'), 'payments')->when($user->isTenantUser(), fn ($query) => $query->where('payments.tenant_user_id', $user->id))->orderByDesc('payments.due_date')->limit(8)->get();
        $maintenance = $scope(DB::table('maintenance_requests')->join('properties', 'properties.id', '=', 'maintenance_requests.property_id')->join('units', 'units.id', '=', 'maintenance_requests.unit_id')->join('users as maintenance_tenants', 'maintenance_tenants.id', '=', 'maintenance_requests.tenant_user_id')->select('maintenance_requests.*', 'properties.name as property_name', 'units.unit_number', 'maintenance_tenants.name as tenant_name'), 'maintenance_requests')->when($user->isTenantUser(), fn ($query) => $query->where('maintenance_requests.tenant_user_id', $user->id))->orderByDesc('maintenance_requests.created_at')->limit(8)->get();
        $documents = $scope(DB::table('documents')->leftJoin('leases as document_leases', 'document_leases.id', '=', 'documents.lease_id')->leftJoin('users as document_tenants', 'document_tenants.id', '=', 'documents.tenant_user_id')->select('documents.*', 'document_leases.monthly_rent as lease_rent', 'document_tenants.name as tenant_name'), 'documents')->when($user->isTenantUser(), fn ($query) => $query->where('documents.tenant_user_id', $user->id))->orderByDesc('documents.created_at')->limit(8)->get();
        $messages = $scope(DB::table('messages')->join('users as senders', 'senders.id', '=', 'messages.sender_id')->join('users as recipients', 'recipients.id', '=', 'messages.recipient_id')->select('messages.*', 'senders.name as sender_name', 'recipients.name as recipient_name'), 'messages')
            ->when(! $isSuperAdmin, function ($query) use ($user) {
                $query->where(function ($inner) use ($user) {
                    $inner->where('messages.sender_id', $user->id)->orWhere('messages.recipient_id', $user->id);
                });
            })
            ->orderByDesc('messages.created_at')->limit(8)->get();
        $tenants = (clone $userQuery)->where('role', 'tenant')->when($user->isTenantUser(), fn ($query) => $query->where('id', $user->id))->orderBy('name')->limit(20)->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'role' => $user->role,
            'stats' => [
                'properties' => $propertyQuery->count(),
                'units' => $unitQuery->count(),
                'occupied_units' => (clone $unitQuery)->where('status', 'occupied')->count(),
                'available_units' => (clone $unitQuery)->where('status', 'available')->count(),
                'active_tenants' => $user->isTenantUser() ? 1 : (clone $userQuery)->where('role', 'tenant')->count(),
                'monthly_expected_rent' => (clone $leaseQuery)->where('status', 'active')->sum('monthly_rent'),
                'pending_payments' => (clone $paymentQuery)->whereIn('status', ['pending', 'partial'])->sum('amount'),
                'overdue_payments' => (clone $paymentQuery)->where('status', 'overdue')->sum('amount'),
                'open_maintenance' => (clone $maintenanceQuery)->whereIn('status', ['open', 'in_progress'])->count(),
            ],
            'data' => [
                'properties' => $properties,
                'units' => $units,
                'tenants' => $tenants,
                'leases' => $leases,
                'payments' => $payments,
                'maintenance' => $maintenance,
                'documents' => $documents,
                'messages' => $messages,
            ],
        ]);
    }
}
