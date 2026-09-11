import { useEffect, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';
import { Modal } from '@/Components/common/Modal';
import type { User } from '@/types/auth';
import type { ManagementResource } from '@/services/managementService';

type ManagementRecordModalProps = {
    resource: ManagementResource;
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

const defaults: Record<ManagementResource, Record<string, string>> = {
    tenants: { name: '', email: '', password: '' },
    units: { property_id: '', unit_number: '', monthly_rent: '' },
    leases: { unit_id: '', tenant_user_id: '', start_date: new Date().toISOString().slice(0, 10), end_date: '2027-12-31', monthly_rent: '', security_deposit: '0' },
    payments: { lease_id: '', tenant_user_id: '', amount: '', due_date: new Date().toISOString().slice(0, 10) },
    maintenance: { property_id: '', unit_id: '', tenant_user_id: '', title: '', description: '' },
    documents: { name: '', type: 'other' },
    messages: { body: '' },
};

const titles: Record<ManagementResource, string> = { tenants: 'Tenant', units: 'Unit', leases: 'Lease', payments: 'Payment', maintenance: 'Maintenance request', documents: 'Document', messages: 'Message' };

export function ManagementRecordModal({ resource, user, isOpen, onClose, onSubmit }: ManagementRecordModalProps) {
    const [form, setForm] = useState(defaults[resource]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setForm({ ...defaults[resource] });
    }, [isOpen, resource]);

    const updateField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const numberValue = (field: string) => form[field] ? Number(form[field]) : null;

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        const payload: Record<string, unknown> = { ...form };
        ['unit_id', 'tenant_user_id', 'property_id', 'lease_id', 'tenant_id'].forEach((field) => {
            if (field in form) payload[field] = numberValue(field);
        });
        ['monthly_rent', 'security_deposit', 'amount'].forEach((field) => {
            if (field in form) payload[field] = numberValue(field);
        });
        if (resource === 'maintenance' && user?.role === 'tenant') payload.tenant_user_id = user.id;
        if (resource === 'maintenance') { payload.priority = 'medium'; payload.status = 'open'; }
        if (resource === 'leases') payload.status = 'active';
        if (resource === 'payments') payload.status = 'pending';
        try {
            await onSubmit(payload);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const field = (name: string, label: string, type = 'text', required = true) => <Input label={label} type={type} value={form[name] ?? ''} onChange={(event) => updateField(name, event.target.value)} required={required} />;
    const organizationField = user?.role === 'super_admin' && <Input label="Organization ID" type="number" value={form.tenant_id ?? ''} onChange={(event) => updateField('tenant_id', event.target.value)} required />;

    return <Modal isOpen={isOpen} title={`Add ${titles[resource]}`} onClose={onClose}>
        <form className="space-y-5" onSubmit={submit}>
            {resource === 'leases' && <div className="grid gap-4 md:grid-cols-2">{field('unit_id', 'Unit ID', 'number')}{field('tenant_user_id', 'Tenant user ID', 'number')}{field('monthly_rent', 'Monthly rent', 'number')}{field('security_deposit', 'Security deposit', 'number', false)}{field('start_date', 'Start date', 'date')}{field('end_date', 'End date', 'date')}</div>}
            {resource === 'payments' && <div className="grid gap-4 md:grid-cols-2">{field('lease_id', 'Lease ID', 'number')}{field('tenant_user_id', 'Tenant user ID', 'number')}{field('amount', 'Amount', 'number')}{field('due_date', 'Due date', 'date')}</div>}
            {resource === 'maintenance' && <div className="grid gap-4 md:grid-cols-2">{field('property_id', 'Property ID', 'number')}{field('unit_id', 'Unit ID', 'number')}{user?.role !== 'tenant' && field('tenant_user_id', 'Tenant user ID', 'number')}{field('title', 'Request title')}{field('description', 'Description')}</div>}
            {resource === 'documents' && <div className="grid gap-4 md:grid-cols-2">{field('name', 'Document name')}<label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Document type</span><select value={form.type} onChange={(event) => updateField('type', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="other">Other</option><option value="lease_agreement">Lease agreement</option><option value="id_verification">ID verification</option><option value="property_document">Property document</option><option value="payment_receipt">Payment receipt</option></select></label></div>}
            {resource === 'messages' && <label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Message</span><textarea value={form.body} onChange={(event) => updateField('body', event.target.value)} required rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>}
            {organizationField}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : `Create ${titles[resource]}`}</Button></div>
        </form>
    </Modal>;
}
