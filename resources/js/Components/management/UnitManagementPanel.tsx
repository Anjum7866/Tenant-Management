import { useEffect, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';
import { Modal } from '@/Components/common/Modal';
import { managementService } from '@/services/managementService';
import { propertyService } from '@/services/propertyService';
import type { Property } from '@/types/property';

type RecordItem = Record<string, unknown>;

type UnitManagementPanelProps = {
    canManage: boolean;
};

const emptyUnit = { property_id: '', unit_number: '', floor: '', bedrooms: '1', bathrooms: '1', monthly_rent: '', status: 'available' };

export function UnitManagementPanel({ canManage }: UnitManagementPanelProps) {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [form, setForm] = useState(emptyUnit);
    const [editing, setEditing] = useState<RecordItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<RecordItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await managementService.list('units');
            setRecords(response.data.data ?? []);
        } catch {
            setError('Unable to load units.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRecords();
        void propertyService.getProperties({}).then((response) => setProperties(response.data)).catch(() => setError('Unable to load properties.'));
    }, []);

    const closeModal = () => {
        setEditing(null);
        setIsModalOpen(false);
        setForm(emptyUnit);
    };

    const updateField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyUnit);
        setIsModalOpen(true);
    };

    const openEdit = (record: RecordItem) => {
        setEditing(record);
        setForm({
            property_id: String(record.property_id ?? ''),
            unit_number: String(record.unit_number ?? ''),
            floor: String(record.floor ?? ''),
            bedrooms: String(record.bedrooms ?? 1),
            bathrooms: String(record.bathrooms ?? 1),
            monthly_rent: String(record.monthly_rent ?? ''),
            status: String(record.status ?? 'available'),
        });
        setIsModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        try {
            const payload = { ...form, property_id: Number(form.property_id), floor: form.floor ? Number(form.floor) : null, bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), monthly_rent: Number(form.monthly_rent) };
            if (editing) await managementService.update('units', Number(editing.id), payload);
            else await managementService.create('units', payload);
            closeModal();
            await loadRecords();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save unit.');
        }
    };

    const remove = async (record: RecordItem) => {
        try {
            await managementService.remove('units', Number(record.id));
            setPendingDelete(null);
            await loadRecords();
        } catch {
            setError('Unable to delete unit.');
        }
    };

    return (
        <section className="glass-panel mb-6 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Portfolio management</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Units</h2><p className="mt-1 text-sm text-slate-500">Create and manage units assigned to your properties.</p></div>
                {canManage && <Button onClick={openCreate}>+ Add Unit</Button>}
            </div>
            {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
            {loading ? <p className="p-6 text-sm text-slate-500">Loading units...</p> : records.length === 0 ? <p className="p-6 text-sm text-slate-500">No units found.</p> : (
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3 font-semibold">Unit</th><th className="px-5 py-3 font-semibold">Property</th><th className="px-5 py-3 font-semibold">Monthly rent</th><th className="px-5 py-3 font-semibold">Status</th>{canManage && <th className="px-5 py-3 font-semibold">Actions</th>}</tr></thead><tbody>{records.map((record) => <tr key={String(record.id)} className="border-t border-slate-200/80 hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{String(record.unit_number)}</div><div className="mt-1 text-xs text-slate-500">Unit ID #{String(record.id)}</div></td><td className="px-5 py-4 text-slate-700">{String(record.property_name ?? `Property #${record.property_id}`)}</td><td className="px-5 py-4 font-medium text-slate-700">INR {String(record.monthly_rent)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{String(record.status)}</span></td>{canManage && <td className="px-5 py-4"><div className="flex gap-3"><button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => openEdit(record)}>Edit</button><button type="button" className="text-xs font-semibold text-red-600 hover:text-red-800" onClick={() => setPendingDelete(record)}>Delete</button></div></td>}</tr>)}</tbody></table></div>
            )}
            <Modal isOpen={Boolean(pendingDelete)} title="Confirm deletion" onClose={() => setPendingDelete(null)}><div className="space-y-5"><p className="text-sm text-slate-600">Delete this unit? This action cannot be undone.</p><div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={() => void remove(pendingDelete as RecordItem)}>Delete</Button></div></div></Modal>
            <Modal isOpen={isModalOpen} title={editing ? 'Edit Unit' : 'Add Unit'} onClose={closeModal}>
                <form className="space-y-5" onSubmit={submit}>
                    <label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Property</span><select required value={form.property_id} onChange={(event) => updateField('property_id', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="">Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name} · {property.city}</option>)}</select></label>
                    <div className="grid gap-4 md:grid-cols-2"><Input label="Unit Number" value={form.unit_number} onChange={(event) => updateField('unit_number', event.target.value)} placeholder="A-101" required /><Input label="Monthly Rent" type="number" value={form.monthly_rent} onChange={(event) => updateField('monthly_rent', event.target.value)} placeholder="25000" required /></div>
                    <div className="grid gap-4 md:grid-cols-3"><Input label="Floor" value={form.floor} onChange={(event) => updateField('floor', event.target.value)} /><Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(event) => updateField('bedrooms', event.target.value)} required /><Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(event) => updateField('bathrooms', event.target.value)} required /></div>
                    <label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option></select></label>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Create Unit'}</Button></div>
                </form>
            </Modal>
        </section>
    );
}
