import { useEffect, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';
import { Modal } from '@/Components/common/Modal';
import { managementService } from '@/services/managementService';

type RecordItem = Record<string, unknown>;

type TenantManagementPanelProps = {
    canManage: boolean;
};

const emptyTenant = { name: '', email: '', password: '' };

export function TenantManagementPanel({ canManage }: TenantManagementPanelProps) {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [form, setForm] = useState(emptyTenant);
    const [editing, setEditing] = useState<RecordItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<RecordItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadRecords = async () => {
        setLoading(true);
        try {
            const response = await managementService.list('tenants');
            setRecords(response.data.data ?? []);
        } catch {
            setError('Unable to load tenants.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRecords();
    }, []);

    const closeModal = () => {
        setEditing(null);
        setIsModalOpen(false);
        setForm(emptyTenant);
    };

    const updateField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyTenant);
        setIsModalOpen(true);
    };

    const openEdit = (record: RecordItem) => {
        setEditing(record);
        setForm({ name: String(record.name ?? ''), email: String(record.email ?? ''), password: '' });
        setIsModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        try {
            if (editing) await managementService.update('tenants', Number(editing.id), { name: form.name, email: form.email });
            else await managementService.create('tenants', form);
            closeModal();
            await loadRecords();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save tenant.');
        }
    };

    const remove = async (record: RecordItem) => {
        try {
            await managementService.remove('tenants', Number(record.id));
            setPendingDelete(null);
            await loadRecords();
        } catch {
            setError('Unable to delete tenant.');
        }
    };

    return (
        <section className="glass-panel mb-6 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">People management</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Tenants</h2><p className="mt-1 text-sm text-slate-500">Manage tenant accounts and their access to the workspace.</p></div>
                {canManage && <Button onClick={openCreate}>+ Add Tenant</Button>}
            </div>
            {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
            {loading ? <p className="p-6 text-sm text-slate-500">Loading tenants...</p> : records.length === 0 ? <p className="p-6 text-sm text-slate-500">No tenants found.</p> : (
                <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3 font-semibold">Tenant</th><th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Access</th>{canManage && <th className="px-5 py-3 font-semibold">Actions</th>}</tr></thead><tbody>{records.map((record) => <tr key={String(record.id)} className="border-t border-slate-200/80 hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{String(record.name)}</div><div className="mt-1 text-xs text-slate-500">Tenant ID #{String(record.id)}</div></td><td className="px-5 py-4 text-slate-700">{String(record.email)}</td><td className="px-5 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Tenant</span></td>{canManage && <td className="px-5 py-4"><div className="flex gap-3"><button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onClick={() => openEdit(record)}>Edit</button><button type="button" className="text-xs font-semibold text-red-600 hover:text-red-800" onClick={() => setPendingDelete(record)}>Delete</button></div></td>}</tr>)}</tbody></table></div>
            )}
            <Modal isOpen={Boolean(pendingDelete)} title="Confirm deletion" onClose={() => setPendingDelete(null)}><div className="space-y-5"><p className="text-sm text-slate-600">Delete this tenant? This action cannot be undone.</p><div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button><Button type="button" variant="danger" onClick={() => void remove(pendingDelete as RecordItem)}>Delete</Button></div></div></Modal>
            <Modal isOpen={isModalOpen} title={editing ? 'Edit Tenant' : 'Add Tenant'} onClose={closeModal}>
                <form className="space-y-5" onSubmit={submit}>
                    <div className="grid gap-5 md:grid-cols-2"><Input label="Tenant Name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Aarav Sharma" required /><Input label="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="tenant@example.com" required />{!editing && <Input label="Temporary Password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} required />}</div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Create Tenant'}</Button></div>
                </form>
            </Modal>
        </section>
    );
}
