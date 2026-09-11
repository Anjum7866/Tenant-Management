import { useEffect, useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';
import { Modal } from '@/Components/common/Modal';
import type { ManagementResource } from '@/services/managementService';

type ManagementEditModalProps = {
    resource: ManagementResource;
    record: Record<string, unknown>;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

const labels: Record<ManagementResource, string> = { tenants: 'Tenant', units: 'Unit', leases: 'Lease', payments: 'Payment', maintenance: 'Maintenance request', documents: 'Document', messages: 'Message' };

export function ManagementEditModal({ resource, record, isOpen, onClose, onSubmit }: ManagementEditModalProps) {
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);
    const field = resource === 'messages' ? 'body' : resource === 'documents' ? 'name' : resource === 'maintenance' ? 'title' : resource === 'units' ? 'unit_number' : resource === 'tenants' ? 'name' : 'status';
    const label = resource === 'messages' ? 'Message' : resource === 'documents' ? 'Document name' : resource === 'maintenance' ? 'Request title' : resource === 'units' ? 'Unit number' : resource === 'tenants' ? 'Tenant name' : 'Status';

    useEffect(() => {
        if (isOpen) setValue(String(record[field] ?? record.body ?? record.name ?? record.title ?? record.unit_number ?? record.status ?? ''));
    }, [isOpen, record, field]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await onSubmit({ [field]: value });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return <Modal isOpen={isOpen} title={`Edit ${labels[resource]}`} onClose={onClose}><form className="space-y-5" onSubmit={submit}>{resource === 'messages' ? <label className="block text-sm text-slate-700"><span className="mb-1 block font-medium">Message</span><textarea value={value} onChange={(event) => setValue(event.target.value)} required rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label> : <Input label={label} value={value} onChange={(event) => setValue(event.target.value)} required />}<div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button></div></form></Modal>;
}
