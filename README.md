# Tenant Management System

A multi-tenant hotel management application built with Laravel + React + TypeScript. The backend enforces tenant isolation so each user can only access hotels belonging to their tenant.

## Tech stack

- Laravel 12
- PHP 8.2
- React + TypeScript
- Vite
- SQLite/MySQL for local development
- Laravel Sanctum

## Features

- Tenant-based authentication
- Tenant-scoped hotel CRUD
- Hotel search, status filter, and pagination
- Protected API endpoints with tenant-aware authorization
- Demo users and hotel data for quick testing

## Demo login accounts

After seeding the database, use these credentials:

- Tenant A Admin
  - Email: admin@tenant-a.test
  - Password: password

- Tenant B Admin
  - Email: admin@tenant-b.test
  - Password: password

These accounts are deliberately separated by tenant, so you can test that Tenant A cannot access Tenant B hotels and vice versa.

## Setup

1. Install PHP dependencies:
   ```bash
   composer install
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Copy environment file and generate app key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Run the database migrations and seed demo data:
   ```bash
   php artisan migrate --seed
   ```

5. Start the application:
   ```bash
   php artisan serve
   ```

6. Start Vite in another terminal:
   ```bash
   npm run dev
   ```

7. Open the app in the browser and sign in with one of the demo accounts above.

## Sample tenant data

The database seeder creates:

- Tenant A with:
  - Grand Hotel
  - City Hotel

- Tenant B with:
  - Beach Resort
  - Mountain Lodge

## API behavior

The app enforces tenant isolation on the backend, so the API resolves the tenant from the authenticated user instead of trusting a client-provided tenant id.

## Verification

Feature tests cover login, hotel listing, and cross-tenant access restrictions:

```bash
php artisan test tests/Feature/MultiTenantApiTest.php
```

## Notes

This project is intended as a clean, production-minded multi-tenant sample and is suitable for demonstration and review.
