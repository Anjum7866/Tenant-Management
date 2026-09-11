import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { LoadingSpinner } from '@/Components/common/LoadingSpinner';
import { Modal } from '@/Components/common/Modal';
import { PropertyForm } from '@/Components/properties/PropertyForm';
import { setStoredToken } from '@/services/api';
import { propertyService } from '@/services/propertyService';
import type { Property, PropertyPayload } from '@/types/property';
import type { User } from '@/types/auth';

const emptyState = 'No properties found. Create your first managed property to begin.';

export default function PropertiesPage({ onLogout }: { onLogout?: () => void }) {
    const [user, setUser] = useState<User | null>(null);
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
            const response = await propertyService.getProperties({
                search,
                city,
                status,
                page: nextPage,
            });

            setProperties(response.data);
            setLastPage(response.meta.last_page || 1);
            setPage(response.meta.current_page || 1);
        } catch {
            setError('Unable to load properties.');
        } finally {
            setLoading(false);
        }
    };

    const loadUser = async () => {
        try {
            const currentUser = await propertyService.me();
            setUser(currentUser);
        } catch {
            setStoredToken(null);
            window.location.href = '/login';
        }
    };

    useEffect(() => {
        void loadUser();
    }, []);

    useEffect(() => {
        if (user) {
            void loadData(page);
        }
    }, [user, search, city, status]);

    const visiblePageNumbers = useMemo(() => Array.from({ length: lastPage }, (_, index) => index + 1), [lastPage]);

    const handleSubmit = async (payload: PropertyPayload) => {
        setSaving(true);
        setError('');

        try {
            if (editingProperty) {
                await propertyService.updateProperty(editingProperty.id, payload);
            } else {
                await propertyService.createProperty(payload);
            }

            setIsModalOpen(false);
            setEditingProperty(null);
            await loadData(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save property.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (propertyId: number) => {
        if (!window.confirm('Delete this property?')) {
            return;
        }

        try {
            await propertyService.deleteProperty(propertyId);
            await loadData(page);
        } catch {
            setError('Unable to delete property.');
        }
    };

    const handleLogout = async () => {
        try {
            await propertyService.logout();
        } finally {
            setStoredToken(null);
            if (onLogout) {
                onLogout();
                return;
            }
            window.location.href = '/login';
        }
    };

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
                            {user?.tenant?.name ?? 'Tenant'}
                        </div>
                        <Button variant="secondary" onClick={handleLogout}>Logout</Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="glass-panel p-5">
                        <p className="text-sm text-slate-500">Active properties</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{properties.filter((property) => property.status === 'active').length}</p>
                    </div>
                    <div className="glass-panel p-5">
                        <p className="text-sm text-slate-500">Tenant portfolio</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{properties.length}</p>
                    </div>
                    <div className="glass-panel p-5">
                        <p className="text-sm text-slate-500">Organization</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{user?.tenant?.name ?? 'Current tenant'}</p>
                    </div>
                </div>

                <div className="glass-panel mb-6 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Properties</h2>
                            <p className="text-sm text-slate-500">Manage residential and commercial assets across your tenant portfolio.</p>
                        </div>
                        <Button onClick={() => {
                            setEditingProperty(null);
                            setIsModalOpen(true);
                        }}>+ Add Property</Button>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_0.8fr]">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, city, or state"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="Filter city"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="glass-panel p-10">
                        <LoadingSpinner label="Loading portfolio..." />
                    </div>
                ) : properties.length === 0 ? (
                    <div className="glass-panel p-10 text-center text-slate-600">
                        <p className="text-lg font-semibold text-slate-800">No properties found.</p>
                        <p className="mt-2 text-sm">{emptyState}</p>
                    </div>
                ) : (
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Property</th>
                                        <th className="px-4 py-3 font-semibold">Type</th>
                                        <th className="px-4 py-3 font-semibold">Location</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property) => (
                                        <tr key={property.id} className="border-t border-slate-200/80">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-slate-900">{property.name}</div>
                                                <div className="mt-1 text-xs text-slate-500">{property.address}</div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">{property.property_type}</td>
                                            <td className="px-4 py-4 text-slate-700">{property.city}, {property.state}</td>
                                            <td className="px-4 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${property.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                    {property.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setEditingProperty(property);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => void handleDelete(property.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
                            {visiblePageNumbers.map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    onClick={() => {
                                        setPage(pageNumber);
                                        void loadData(pageNumber);
                                    }}
                                    className={`h-8 w-8 rounded-md text-sm ${page === pageNumber ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Modal
                isOpen={isModalOpen}
                title={editingProperty ? 'Edit Property' : 'Create Property'}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProperty(null);
                }}
            >
                <PropertyForm
                    initialProperty={editingProperty}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingProperty(null);
                    }}
                    isSaving={saving}
                />
            </Modal>
        </div>
    );
}
