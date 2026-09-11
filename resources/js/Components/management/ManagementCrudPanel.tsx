import { useEffect, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Modal } from '@/Components/common/Modal';
import { Input } from '@/Components/common/Input';
import { managementService, type ManagementResource } from '@/services/managementService';

type ManagementCrudPanelProps = {
    resource: 'units' | 'tenants';
    canManage: boolean;
};

type RecordItem = Record<string, unknown>;

const unitDefaults = { property_id: '', unit_number: '', floor: '', bedrooms: '1', bathrooms: '1', monthly_rent: '', status: 'available' };
const tenantDefaults = { name: '', email: '', password: '' };

export function ManagementCrudPanel({ resource, canManage }: ManagementCrudPanelProps) {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState<RecordItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<Record<string, string>>(resource === 'units' ? unitDefaults : tenantDefaults);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await managementService.list(resource);
            setRecords(response.data.data ?? []);
        } catch {
            setError(`Unable to load ${resource}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setForm(resource === 'units' ? unitDefaults : tenantDefaults);
        void loadRecords();
    }, [resource]);

    const openCreate = () => {
        setEditing(null);
        setForm(resource === 'units' ? unitDefaults : tenantDefaults);
        setIsModalOpen(true);
    };

    const openEdit = (record: RecordItem) => {
        setEditing(record);
        if (resource === 'units') {
            setForm({
                property_id: String(record.property_id ?? ''),
                unit_number: String(record.unit_number ?? ''),
                floor: String(record.floor ?? ''),
                bedrooms: String(record.bedrooms ?? 1),
                bathrooms: String(record.bathrooms ?? 1),
                monthly_rent: String(record.monthly_rent ?? ''),
                status: String(record.status ?? 'available'),
            });
        } else {
            setForm({ name: String(record.name ?? ''), email: String(record.email ?? ''), password: '' });
        }
        setIsModalOpen(true);
    };

    const updateField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        try {
            const payload = resource === 'units'
                ? { ...form, property_id: Number(form.property_id), floor: form.floor ? Number(form.floor) : null, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), monthly_rent: Number(form.monthly_rent) }
                : { ...form };
            if (editing) await managementService.update(resource, Number(editing.id), payload);
            else await managementService.create(resource, payload);
            setEditing(null);
            setIsModalOpen(false);
            await loadRecords();
        } catch (err) {
            setError(err instanceof Error ? err.message : `Unable to save ${resource.slice(0, -1)}.`);
        }
    };

    const remove = async (record: RecordItem) => {
        if (!window.confirm(`Delete this ${resource === 'units' ? 'unit' : 'tenant'}?`)) return;
        try {
            await managementService.remove(resource, Number(record.id));
            await loadRecords();
        } catch {
            setError(`Unable to delete ${resource.slice(0, -1)}.`);
        }
    };

    return (
        <section className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div><h3 className="font-semibold capitalize text-slate-900">{resource}</h3><p className="mt-1 text-xs text-slate-500">{records.length} records with linked property context</p></div>
                {canManage && <Button onClick={openCreate}>+ Add {resource === 'units' ? 'Unit' : 'Tenant'}</Button>}
            </div>
            {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
            {loading ? <p className="p-6 text-sm text-slate-500">Loading {resource}...</p> : records.length === 0 ? <p className="p-6 text-sm text-slate-500">No {resource} found.</p> : (
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>
                    <th className="px-5 py-3 font-semibold">{resource === 'units' ? 'Unit' : 'Tenant'}</th>
                    {resource === 'units' ? <><th className="px-5 py-3 font-semibold">Property</th><th className="px-5 py-3 font-semibold">Rent</th><th className="px-5 py-3 font-semibold">Status</th></> : <><th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Role</th></>}
                    {canManage && <th className="px-5 py-3 font-semibold">Actions</th>}
                </tr></thead><tbody>{records.map((record) => <tr key={String(record.id)} className="border-t border-slate-200">
                    <td className="px-5 py-4 font-medium text-slate-900">{String(resource === 'units' ? record.unit_number : record.name)}</td>
                    {resource === 'units' ? <><td className="px-5 py-4 text-slate-700">{String(record.property_name ?? `Property #${record.property_id}`)}</td><td className="px-5 py-4 text-slate-700">INR {String(record.monthly_rent)}</td><td className="px-5 py-4 capitalize text-slate-700">{String(record.status)}</td></> : <><td className="px-5 py-4 text-slate-700">{String(record.email)}</td><td className="px-5 py-4 text-slate-700">Tenant</td></>}
                    {canManage && <td className="px-5 py-4"><div className="flex gap-3"><button type="button" className="text-xs font-semibold text-indigo-600" onClick={() => openEdit(record)}>Edit</button><button type="button" className="text-xs font-semibold text-red-600" onClick={() => void remove(record)}>Delete</button></div></td>}
                </tr>)}</tbody></table></div>
            )}

            <Modal isOpen={isModalOpen} title={`${editing ? 'Edit' : 'Add'} ${resource === 'units' ? 'Unit' : 'Tenant'}`} onClose={() => { setEditing(null); setIsModalOpen(false); }}>
                <form className="space-y-4" onSubmit={submit}>
                    {resource === 'units' ? <>
                        <Input label="Property ID" value={form.property_id} onChange={(event) => updateField('property_id', event.target.value)} placeholder="1" />
                        <div className="grid gap-4 md:grid-cols-2"><Input label="Unit Number" value={form.unit_number} onChange={(event) => updateField('unit_number', event.target.value)} placeholder="A-101" /><Input label="Monthly Rent" type="number" value={form.monthly_rent} onChange={(event) => updateField('monthly_rent', event.target.value)} placeholder="25000" /></div>
                        <div className="grid gap-4 md:grid-cols-2"><Input label="Floor" value={form.floor} onChange={(event) => updateField('floor', event.target.value)} /><Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(event) => updateField('bedrooms', event.target.value)} /></div>
                        <label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></label>
                    </> : <><Input label="Tenant Name" value={form.name} onChange={(event) => updateField('name', event.target.value)} /><Input label="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />{!editing && <Input label="Temporary Password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} />}</>}
                    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => { setEditing(null); setIsModalOpen(false); }}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Create'}</Button></div>
                </form>
            </Modal>
        </section>
    );
}
