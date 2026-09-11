import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { LoadingSpinner } from '@/Components/common/LoadingSpinner';
import { Modal } from '@/Components/common/Modal';
import { PropertyForm } from '@/Components/properties/PropertyForm';
import { setStoredToken } from '@/services/api';
import { propertyService } from '@/services/propertyService';
import { managementService, type ManagementResource } from '@/services/managementService';
import { ManagementCrudPanel } from '@/Components/management/ManagementCrudPanel';
import type { User } from '@/types/auth';
import type { DashboardResponse } from '@/types/dashboard';
import type { Property, PropertyPayload } from '@/types/property';

const emptyState = 'No properties found. Create your first managed property to begin.';
const roleLabels = { super_admin: 'Super Admin', property_manager: 'Property Manager', tenant: 'Tenant' };
const sidebarSections = [
    { id: 'dashboard', label: 'Dashboard', icon: '01' },
    { id: 'properties', label: 'Properties', icon: '02' },
    { id: 'units', label: 'Units', icon: '03' },
    { id: 'tenants', label: 'Tenants', icon: '04' },
    { id: 'leases', label: 'Leases', icon: '05' },
    { id: 'payments', label: 'Payments', icon: '06' },
    { id: 'maintenance', label: 'Maintenance', icon: '07' },
    { id: 'documents', label: 'Documents', icon: '08' },
    { id: 'messages', label: 'Messages', icon: '09' },
];

const displayValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value).replaceAll('_', ' ');
};

type RecordListProps = {
    sectionId: string;
    title: string;
    records: Array<Record<string, unknown>>;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    addLabel?: string;
    onAdd?: () => void;
    onEdit?: (record: Record<string, unknown>) => void;
    onDelete?: (record: Record<string, unknown>) => void;
};

function RecordList({ sectionId, title, records, canAdd, canEdit, canDelete, addLabel, onAdd, onEdit, onDelete }: RecordListProps) {
    return (
        <section id={sectionId} className="glass-panel scroll-mt-6 overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">{records.length} authorized records</p></div>
                    {canAdd && <Button onClick={onAdd}>+ {addLabel ?? 'Add Record'}</Button>}
                </div>
            </div>
            <div className="divide-y divide-slate-100">
                {records.slice(0, 4).map((record, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 text-sm">
                        <span className="truncate font-medium capitalize text-slate-800">{displayValue(record.title ?? record.name ?? record.unit_number ?? record.reference ?? `Record ${index + 1}`)}</span>
                        <div className="flex items-center gap-2">
                            <span className="truncate text-right capitalize text-slate-500">{displayValue(record.status ?? record.type ?? record.body ?? record.monthly_rent)}</span>
                            {canEdit && <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => onEdit?.(record)}>Edit</button>}
                            {canDelete && <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-800" onClick={() => onDelete?.(record)}>Delete</button>}
                        </div>
                    </div>
                ))}
                {records.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No records yet.</p>}
            </div>
        </section>
    );
}

type PropertiesPageProps = {
    activeSection: string;
    onNavigate: (path: string) => void;
    onLogout?: () => void;
};

export default function PropertiesPage({ activeSection, onNavigate, onLogout }: PropertiesPageProps) {
    const [user, setUser] = useState<User | null>(null);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [error, setError] = useState('');

    const loadData = async (nextPage = 1) => {
        setLoading(true);
        setError('');
        try {
            const response = await propertyService.getProperties({ search, city, status, page: nextPage });
            setProperties(response.data);
            setLastPage(response.meta.last_page || 1);
            setPage(response.meta.current_page || 1);
        } catch {
            setError('Unable to load properties.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await propertyService.me();
                setUser(currentUser);
                setDashboard(await propertyService.getDashboard());
            } catch {
                setStoredToken(null);
                window.location.href = '/login';
            }
        };
        void loadUser();
    }, []);

    useEffect(() => {
        if (user && activeSection === 'properties') void loadData(page);
    }, [user, activeSection, search, city, status]);

    const visiblePageNumbers = useMemo(() => Array.from({ length: lastPage }, (_, index) => index + 1), [lastPage]);
    const handleSubmit = async (payload: PropertyPayload) => {
        setSaving(true);
        setError('');
        try {
            if (editingProperty) await propertyService.updateProperty(editingProperty.id, payload);
            else {
                const organizationId = user?.role === 'super_admin' ? window.prompt('Organization ID for this property') : null;
                if (user?.role === 'super_admin' && !organizationId) return;
                await propertyService.createProperty({ ...payload, ...(organizationId ? { tenant_id: Number(organizationId) } : {}) });
            }
            setIsModalOpen(false);
            setEditingProperty(null);
            await loadData(page);
            setDashboard(await propertyService.getDashboard());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save property.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (propertyId: number) => {
        if (!window.confirm('Delete this property?')) return;
        try {
            await propertyService.deleteProperty(propertyId);
            await loadData(page);
            setDashboard(await propertyService.getDashboard());
        } catch {
            setError('Unable to delete property.');
        }
    };

    const refreshDashboard = async () => setDashboard(await propertyService.getDashboard());

    const handleAddRecord = async (resource: ManagementResource) => {
        try {
            if (resource === 'tenants') {
                const name = window.prompt('Tenant name');
                const email = window.prompt('Tenant email');
                const password = window.prompt('Temporary password (minimum 8 characters)');
                if (!name || !email || !password) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { name, email, password, ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else if (resource === 'units') {
                const propertyId = window.prompt('Property ID');
                const unitNumber = window.prompt('Unit number');
                const rent = window.prompt('Monthly rent');
                if (!propertyId || !unitNumber || !rent) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { property_id: Number(propertyId), unit_number: unitNumber, monthly_rent: Number(rent), bedrooms: 1, bathrooms: 1, status: 'available', ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else if (resource === 'leases') {
                const unitId = window.prompt('Unit ID');
                const tenantUserId = window.prompt('Tenant user ID');
                const rent = window.prompt('Monthly rent');
                if (!unitId || !tenantUserId || !rent) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { unit_id: Number(unitId), tenant_user_id: Number(tenantUserId), start_date: new Date().toISOString().slice(0, 10), end_date: '2027-12-31', monthly_rent: Number(rent), security_deposit: 0, status: 'active', ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else if (resource === 'payments') {
                const leaseId = window.prompt('Lease ID');
                const tenantUserId = window.prompt('Tenant user ID');
                const amount = window.prompt('Amount');
                if (!leaseId || !tenantUserId || !amount) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { lease_id: Number(leaseId), tenant_user_id: Number(tenantUserId), amount: Number(amount), due_date: new Date().toISOString().slice(0, 10), status: 'pending', ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else if (resource === 'maintenance') {
                const propertyId = window.prompt('Property ID');
                const unitId = window.prompt('Unit ID');
                const title = window.prompt('Request title');
                const description = window.prompt('Description');
                if (!propertyId || !unitId || !title || !description) return;
                const tenantUserId = user?.role === 'tenant' ? user.id : Number(window.prompt('Tenant user ID'));
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { property_id: Number(propertyId), unit_id: Number(unitId), tenant_user_id: tenantUserId, title, description, priority: 'medium', status: 'open', ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else if (resource === 'documents') {
                const name = window.prompt('Document name');
                const type = window.prompt('Document type: lease_agreement, id_verification, property_document, payment_receipt, other', 'other');
                if (!name || !type) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { name, type, ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            } else {
                const body = window.prompt('Message');
                if (!body) return;
                const tenantId = user?.role === 'super_admin' ? window.prompt('Organization ID') : null;
                if (user?.role === 'super_admin' && !tenantId) return;
                await managementService.create(resource, { body, ...(tenantId ? { tenant_id: Number(tenantId) } : {}) });
            }
            await refreshDashboard();
        } catch {
            setError(`Unable to create ${resource.slice(0, -1)}.`);
        }
    };

    const handleEditRecord = async (resource: ManagementResource, record: Record<string, unknown>) => {
        const id = Number(record.id);
        if (!id) return;
        try {
            if (resource === 'tenants') {
                const name = window.prompt('Tenant name', String(record.name ?? ''));
                const email = window.prompt('Tenant email', String(record.email ?? ''));
                if (!name || !email) return;
                await managementService.update(resource, id, { name, email });
            } else {
                const field = resource === 'messages' ? 'Message' : resource === 'documents' ? 'Document name' : resource === 'maintenance' ? 'Request title' : resource === 'units' ? 'Unit number' : 'Status';
                const value = window.prompt(field, String(record.body ?? record.name ?? record.title ?? record.unit_number ?? record.status ?? ''));
                if (!value) return;
                const payload = resource === 'messages' ? { body: value } : resource === 'documents' ? { name: value } : resource === 'maintenance' ? { title: value } : resource === 'units' ? { unit_number: value } : { status: value };
                await managementService.update(resource, id, payload);
            }
            await refreshDashboard();
        } catch {
            setError(`Unable to update ${resource.slice(0, -1)}.`);
        }
    };

    const handleDeleteRecord = async (resource: ManagementResource, record: Record<string, unknown>) => {
        const id = Number(record.id);
        if (!id || !window.confirm(`Delete this ${resource.slice(0, -1)}?`)) return;
        try {
            await managementService.remove(resource, id);
            await refreshDashboard();
        } catch {
            setError(`Unable to delete ${resource.slice(0, -1)}.`);
        }
    };

    const handleLogout = async () => {
        try { await propertyService.logout(); } finally {
            setStoredToken(null);
            if (onLogout) onLogout();
            else window.location.href = '/login';
        }
    };

    const stats = dashboard?.stats;

    return (
        <div className="min-h-screen bg-transparent text-slate-800">
            <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">Portfolio</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Tenant Management System</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                            {roleLabels[user?.role ?? 'tenant']} · {user?.tenant?.name ?? 'All organizations'}
                        </div>
                        <Button variant="secondary" onClick={handleLogout}>Logout</Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-[1440px] items-start gap-6 px-4 py-6 lg:px-8">
                <aside className="sticky top-6 hidden w-60 shrink-0 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] lg:block">
                    <div className="mb-6 border-b border-white/10 px-2 pb-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Workspace</p>
                        <p className="mt-2 text-sm font-medium text-white">{user?.tenant?.name ?? 'All organizations'}</p>
                        <p className="mt-1 text-xs text-slate-400">{roleLabels[user?.role ?? 'tenant']}</p>
                    </div>
                    <nav className="space-y-1" aria-label="Tenant management sections">
                        {sidebarSections.map((section) => (
                            <button key={section.id} type="button" onClick={() => onNavigate(`/${section.id}`)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeSection === section.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs text-indigo-200">{section.icon}</span>
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1 py-2">
                    <div id="dashboard" className="mb-6 scroll-mt-6 flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">{roleLabels[user?.role ?? 'tenant']} workspace</p>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{activeSection === 'dashboard' ? (user?.role === 'tenant' ? 'Your rental overview' : 'Portfolio overview') : sidebarSections.find((section) => section.id === activeSection)?.label}</h2>
                        <p className="text-sm text-slate-500">{activeSection === 'dashboard' ? 'Your role determines the records and actions available in this workspace.' : `Manage and review ${sidebarSections.find((section) => section.id === activeSection)?.label.toLowerCase()} for your authorized scope.`}</p>
                    </div>

                    {activeSection === 'dashboard' && <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                        {[
                            ['Properties', stats?.properties ?? properties.length],
                            ['Units', stats?.units ?? 0],
                            ['Occupied / available', `${stats?.occupied_units ?? 0} / ${stats?.available_units ?? 0}`],
                            ['Expected monthly rent', `INR ${(stats?.monthly_expected_rent ?? 0).toLocaleString('en-IN')}`],
                            ['Open maintenance', stats?.open_maintenance ?? 0],
                        ].map(([label, value]) => (
                            <div key={label as string} className="glass-panel p-5">
                                <p className="text-sm text-slate-500">{label as string}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">{value as string | number}</p>
                            </div>
                        ))}
                    </div>}

                    {activeSection === 'properties' && <div id="properties" className="glass-panel mb-6 scroll-mt-6 p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Properties</h2>
                                <p className="text-sm text-slate-500">Manage residential and commercial assets across your authorized portfolio.</p>
                            </div>
                            {user?.role !== 'tenant' && <Button onClick={() => { setEditingProperty(null); setIsModalOpen(true); }}>+ Add Property</Button>}
                        </div>
                        <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_0.8fr]">
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, city, or state" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Filter city" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                                <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>}

                    {activeSection === 'properties' && error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                    {activeSection === 'properties' && (loading ? <div className="glass-panel p-10"><LoadingSpinner label="Loading properties..." /></div> : properties.length === 0 ? (
                        <div className="glass-panel p-10 text-center text-slate-600"><p className="text-lg font-semibold text-slate-800">No properties found.</p><p className="mt-2 text-sm">{emptyState}</p></div>
                    ) : (
                        <div className="glass-panel overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3 font-semibold">Property</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Location</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead>
                                    <tbody>{properties.map((property) => <tr key={property.id} className="border-t border-slate-200/80">
                                        <td className="px-4 py-4"><div className="font-semibold text-slate-900">{property.name}</div><div className="mt-1 text-xs text-slate-500">{property.address}</div><div className="mt-1 text-xs text-indigo-600">{String(dashboard?.data.properties.find((record) => Number(record.id) === property.id)?.units_count ?? 0)} units · {String(dashboard?.data.properties.find((record) => Number(record.id) === property.id)?.tenants_count ?? 0)} tenants</div></td>
                                        <td className="px-4 py-4 text-slate-700">{property.property_type}</td><td className="px-4 py-4 text-slate-700">{property.city}, {property.state}</td>
                                        <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${property.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{property.status}</span></td>
                                        <td className="px-4 py-4"><div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditingProperty(property); setIsModalOpen(true); }}>Edit</Button><Button variant="danger" onClick={() => void handleDelete(property.id)}>Delete</Button></div></td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">{visiblePageNumbers.map((pageNumber) => <button key={pageNumber} type="button" onClick={() => { setPage(pageNumber); void loadData(pageNumber); }} className={`h-8 w-8 rounded-md text-sm ${page === pageNumber ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{pageNumber}</button>)}</div>
                        </div>
                    ))}

                    {(activeSection === 'units' || activeSection === 'tenants') && <ManagementCrudPanel resource={activeSection as 'units' | 'tenants'} canManage={user?.role === 'super_admin' || user?.role === 'property_manager'} />}

                    {dashboard && activeSection === 'dashboard' && <div className="mt-6 grid gap-6 xl:grid-cols-2">
                        <RecordList sectionId="dashboard-properties" title="Recent properties" records={dashboard.data.properties} />
                        <RecordList sectionId="dashboard-payments" title="Recent payments" records={dashboard.data.payments} />
                    </div>}

                    {dashboard && activeSection !== 'dashboard' && activeSection !== 'properties' && activeSection !== 'units' && activeSection !== 'tenants' && <div className="mt-6 grid gap-6 xl:grid-cols-2">
                        {[
                            ['units', 'Units', dashboard.data.units],
                            ['tenants', 'Tenants', dashboard.data.tenants],
                            ['leases', 'Leases', dashboard.data.leases],
                            ['payments', 'Payments', dashboard.data.payments],
                            ['maintenance', 'Maintenance requests', dashboard.data.maintenance],
                            ['documents', 'Documents', dashboard.data.documents],
                            ['messages', 'Messages', dashboard.data.messages],
                        ].filter(([sectionId]) => sectionId === activeSection).map(([sectionId, title, records]) => {
                            const resource = sectionId as ManagementResource;
                            const recordsList = records as Array<Record<string, unknown>>;
                            const isManager = user?.role === 'property_manager';
                            const isSuperAdmin = user?.role === 'super_admin';
                            const canAdd = (resource === 'documents' && (isSuperAdmin || user?.role === 'tenant')) || (resource === 'messages' && (isSuperAdmin || isManager || user?.role === 'tenant')) || (resource === 'maintenance') || (['tenants', 'units', 'leases', 'payments'].includes(resource) && (isSuperAdmin || isManager));
                            const canEdit = ['tenants', 'units', 'leases', 'payments', 'maintenance'].includes(resource) ? (isSuperAdmin || isManager) : false;
                            const canDelete = isSuperAdmin || (isManager && resource !== 'messages');
                            const addLabel = resource === 'units' ? 'Add Unit' : resource === 'tenants' ? 'Add Tenant' : resource === 'maintenance' ? 'Add Request' : resource === 'documents' ? 'Add Document' : resource === 'messages' ? 'New Message' : `Add ${title}`;
                            return <RecordList key={sectionId as string} sectionId={sectionId as string} title={title as string} records={recordsList} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} addLabel={addLabel} onAdd={() => void handleAddRecord(resource)} onEdit={(record) => void handleEditRecord(resource, record)} onDelete={(record) => void handleDeleteRecord(resource, record)} />;
                        })}
                    </div>}
                </main>
            </div>

            <Modal isOpen={isModalOpen} title={editingProperty ? 'Edit Property' : 'Create Property'} onClose={() => { setIsModalOpen(false); setEditingProperty(null); }}>
                <PropertyForm initialProperty={editingProperty} onSubmit={handleSubmit} onCancel={() => { setIsModalOpen(false); setEditingProperty(null); }} isSaving={saving} />
            </Modal>
        </div>
    );
}
