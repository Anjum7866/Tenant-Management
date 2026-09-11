import { useEffect, useState } from 'react';
import type { Property, PropertyPayload, PropertyStatus } from '@/types/property';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';

const defaultForm: PropertyPayload = {
    name: '',
    property_type: 'Apartment',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    description: '',
    status: 'active',
};

type PropertyFormProps = {
    initialProperty?: Property | null;
    onSubmit: (payload: PropertyPayload) => Promise<void> | void;
    onCancel: () => void;
    isSaving: boolean;
};

export function PropertyForm({ initialProperty, onSubmit, onCancel, isSaving }: PropertyFormProps) {
    const [form, setForm] = useState<PropertyPayload>(defaultForm);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialProperty) {
            setForm({
                name: initialProperty.name,
                property_type: initialProperty.property_type,
                address: initialProperty.address,
                city: initialProperty.city,
                state: initialProperty.state,
                zip_code: initialProperty.zip_code,
                description: initialProperty.description ?? '',
                status: initialProperty.status,
            });
            return;
        }

        setForm(defaultForm);
    }, [initialProperty]);

    const updateField = (field: keyof PropertyPayload, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: '' }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = 'Property name is required.';
        if (!form.address.trim()) newErrors.address = 'Address is required.';
        if (!form.city.trim()) newErrors.city = 'City is required.';
        if (!form.state.trim()) newErrors.state = 'State is required.';
        if (!form.zip_code.trim()) newErrors.zip_code = 'ZIP code is required.';
        if (!form.status) newErrors.status = 'Status is required.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload: PropertyPayload = {
            ...form,
            description: form.description?.trim() || null,
            status: form.status,
        };

        await onSubmit(payload);
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <Input
                    label="Property Name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    error={errors.name}
                    placeholder="Sunrise Apartments"
                />
                <label className="block text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Property Type</span>
                    <select
                        value={form.property_type}
                        onChange={(event) => updateField('property_type', event.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="Apartment">Apartment</option>
                        <option value="House">House</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Villa">Villa</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
            </div>

            <Input
                label="Address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                error={errors.address}
                placeholder="15 Lakeview Road"
            />

            <div className="grid gap-4 md:grid-cols-3">
                <Input
                    label="City"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    error={errors.city}
                    placeholder="Pune"
                />
                <Input
                    label="State"
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value)}
                    error={errors.state}
                    placeholder="Maharashtra"
                />
                <Input
                    label="ZIP Code"
                    value={form.zip_code}
                    onChange={(event) => updateField('zip_code', event.target.value)}
                    error={errors.zip_code}
                    placeholder="411001"
                />
            </div>

            <Input
                label="Description"
                value={form.description ?? ''}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Premium residential property with amenities"
            />

            <label className="block text-sm text-slate-700">
                <span className="mb-1 block font-medium">Status</span>
                <select
                    value={form.status}
                    onChange={(event) => updateField('status', event.target.value as PropertyStatus)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </label>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : initialProperty ? 'Update Property' : 'Create Property'}
                </Button>
            </div>
        </form>
    );
}
