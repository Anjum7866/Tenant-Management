import { TenantManagementPanel } from './TenantManagementPanel';
import { UnitManagementPanel } from './UnitManagementPanel';

type ManagementCrudPanelProps = {
    resource: 'units' | 'tenants';
    canManage: boolean;
};

export function ManagementCrudPanel({ resource, canManage }: ManagementCrudPanelProps) {
    return resource === 'units'
        ? <UnitManagementPanel canManage={canManage} />
        : <TenantManagementPanel canManage={canManage} />;
}
