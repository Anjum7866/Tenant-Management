# Tenant Management System

A multi-tenant property-management SaaS MVP built with Laravel 12, React, TypeScript, Vite, and Laravel Sanctum.

The system follows the workflow in `NewTenantLogic.md`:

`Organization -> Properties -> Units -> Tenants -> Leases -> Payments -> Maintenance -> Documents -> Messages`

## Roles and demo credentials

Run `php artisan migrate:fresh --seed` to recreate the demo database. Every password below is intentionally different so each role can be tested independently.

| Role | Organization | Name | Email | Password |
| --- | --- | --- | --- | --- |
| Super Admin | All organizations | System Super Admin | `superadmin@tms.test` | `superadmin123` |
| Property Manager | Tenant A | Tenant A Manager | `manager@tenant-a.test` | `manager123` |
| Tenant | Tenant A | Aarav Sharma | `tenant@tenant-a.test` | `tenant123` |
| Property Manager | Tenant B | Tenant B Manager | `manager@tenant-b.test` | `manager123` |
| Tenant | Tenant B | Meera Iyer | `tenant@tenant-b.test` | `tenant123` |

### Role visibility

- **Super Admin** sees organization-wide totals and all seeded organization records.
- **Property Manager** sees every property-management record belonging to their organization.
- **Tenant** sees only their assigned lease, unit, payments, maintenance requests, documents, and messages.
- The backend derives organization scope from the authenticated user. A submitted `tenant_id` is never trusted.

## Implemented MVP data

The seed creates two isolated organizations:

- **Tenant A**
  - Sunrise Apartments, Pune
  - Harbor Residences, Mumbai
  - Units A-102 and A-103
  - Aarav Sharma's active lease and paid rent record
  - AC maintenance request in progress
  - Lease agreement document and manager conversation
- **Tenant B**
  - Oakwood Townhomes, Goa
  - Pinecrest Homes, Shimla
  - Unit B-201
  - Meera Iyer's active lease and overdue rent record
  - Resolved bathroom maintenance request
  - ID verification document and manager conversation

The dashboard displays properties, units, leases, payments, maintenance requests, documents, and messages. Summary cards include expected rent, occupied/available units, active tenants, overdue/pending amounts, and open maintenance.

## Tech stack

- Laravel 12 / PHP 8.2
- React + TypeScript
- Vite
- Laravel Sanctum token authentication
- SQLite or MySQL
- Tailwind CSS

## Setup

1. Install dependencies:

   ```bash
   composer install
   npm install
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Create the database and demo records:

   ```bash
   php artisan migrate:fresh --seed
   ```

4. Start Laravel:

   ```bash
   php artisan serve
   ```

5. In another terminal, start Vite:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:8000` and sign in with any account above.

## API

Authentication:

- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

Dashboard:

- `GET /api/dashboard`

Property management:

- `GET|POST /api/properties`
- `GET|PUT|DELETE /api/properties/{id}`

The dashboard response is role-aware and tenant-scoped. Property data is protected by organization ownership checks.

## Verification

Run the focused multi-tenant tests and frontend build:

```bash
php artisan test tests/Feature/MultiTenantApiTest.php
npm run build
```

## Notes

- No real payment gateway is integrated. Payments are recorded as internal tracking records, as required for the MVP.
- File uploads and real-time messaging are intentionally represented by metadata and standard API records for this MVP.
- `NewTenantLogic.md` remains the product and architecture reference for future CRUD screens.
