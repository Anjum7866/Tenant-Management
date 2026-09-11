# Multi-Tenant Hotel Management System
## Professional Take-Home Implementation Specification

### Objective

Build a clean, professional and production-minded **Multi-Tenant Hotel Management System** using:
I have already setup of laravel breeze+Typescript start implementing in this
- **Backend:** PHP 8+ / Laravel

### Implementation Status

The following core pieces are already implemented in the current codebase:

- ✅ Tenant and hotel database schema with tenant ownership and foreign key constraints
- ✅ Eloquent models and relationships for Tenant, User, and Hotel
- ✅ Laravel Sanctum authentication flow with login, logout, and current-user endpoints
- ✅ Tenant-scoped hotel CRUD API with search, location filtering, and status filtering
- ✅ Hotel authorization checks that enforce a tenant boundary on every request
- ✅ Feature tests covering login and cross-tenant access protection
- ✅ React login screen, hotel dashboard, modal form, filter/search UI, and delete/edit flows
- ✅ SPA state management using local React state and API service layer for tenant-scoped hotel operations
- **Frontend:** React + TypeScript
- **Database:** MySQL
- **Authentication:** Laravel Sanctum
- **API:** RESTful JSON APIs
- **Testing:** Laravel Feature tests using PHPUnit or Pest
- **HTTP client:** Axios
- **Styling:** Simple, modern, responsive UI using the existing project setup or lightweight CSS

The project should be intentionally small enough to complete within 2–3 hours, but the code quality should demonstrate professional engineering practices.

The reviewer should be able to quickly understand:
- How authentication works
- How tenant isolation works
- Where validation lives
- Where business logic lives
- How React components are organized
- How errors are handled
- How the solution is tested
- Why the technical decisions were made

---

# 1. Core Business Requirement

The application is a small SaaS-style hotel management platform.

Multiple companies/customers (**tenants**) use the same application.

Each authenticated user belongs to exactly one tenant.

Each tenant can manage only its own hotels.

Example:

Tenant A:
- Grand Hotel
- City Hotel

Tenant B:
- Beach Resort
- Mountain Resort

Tenant A must NEVER be able to view, update or delete Tenant B's hotels.

### Critical security rule

Tenant isolation MUST be enforced on the Laravel backend.

Do not rely on React to hide data.

Do not accept a client-provided `tenant_id` as the source of authorization.

The backend must derive the tenant from the authenticated user.

---

# 2. Recommended Architecture

Use a simple modular monolith.

```text
React + TypeScript
        |
        | REST API
        v
Laravel
        |
        +-- Authentication
        +-- Form Requests
        +-- Policies / Authorization
        +-- Services
        +-- API Resources
        |
        v
MySQL
```

Do NOT introduce microservices.

Do NOT create unnecessary repository/interface layers.

Prefer simple, readable code.

---

# 3. Backend Folder Structure

Use a clean Laravel structure such as:

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   └── HotelController.php
│   │
│   ├── Requests/
│   │   ├── LoginRequest.php
│   │   ├── StoreHotelRequest.php
│   │   └── UpdateHotelRequest.php
│   │
│   └── Resources/
│       ├── UserResource.php
│       ├── TenantResource.php
│       └── HotelResource.php
│
├── Models/
│   ├── Tenant.php
│   ├── User.php
│   └── Hotel.php
│
├── Policies/
│   └── HotelPolicy.php
│
└── Services/
    └── HotelService.php
```

Keep controllers thin.

Controllers should mainly:
1. receive the request
2. delegate business logic
3. return the response

Avoid putting large business rules inside controllers.

---

# 4. Database Design

Use one shared MySQL database with row-level tenant isolation.

## tenants

```text
id              BIGINT UNSIGNED PRIMARY KEY
name            VARCHAR(150) NOT NULL
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## users

Use Laravel's standard users table and add:

```text
id
tenant_id       BIGINT UNSIGNED NOT NULL
name            VARCHAR(150) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password        VARCHAR(...)
created_at
updated_at
```

Foreign key:

```text
users.tenant_id -> tenants.id
```

## hotels

```text
id              BIGINT UNSIGNED PRIMARY KEY
tenant_id       BIGINT UNSIGNED NOT NULL
name            VARCHAR(150) NOT NULL
location        VARCHAR(200) NOT NULL
description     TEXT NULL
contact_email   VARCHAR(255) NULL
status          ENUM('active', 'inactive') DEFAULT 'active'
created_at
updated_at
```

Foreign key:

```text
hotels.tenant_id -> tenants.id
```

Indexes:

```text
INDEX(tenant_id)
INDEX(tenant_id, status)
```

Use appropriate foreign key delete behavior.

---

# 5. Laravel Model Relationships

Implement:

```php
Tenant hasMany User
Tenant hasMany Hotel

User belongsTo Tenant

Hotel belongsTo Tenant
```

Use Eloquent relationships.

Avoid repeatedly writing raw relationship logic throughout the application.

---

# 6. Authentication

Use Laravel Sanctum.

Required endpoints:

```text
POST /api/login
POST /api/logout
GET  /api/me
```

### Login

Request:

```json
{
  "email": "admin@tenant-a.test",
  "password": "password"
}
```

Response:

```json
{
  "message": "Login successful.",
  "token": "...",
  "user": {
    "id": 1,
    "name": "Tenant A Admin",
    "email": "admin@tenant-a.test",
    "tenant": {
      "id": 1,
      "name": "Tenant A"
    }
  }
}
```

Never expose passwords or other sensitive fields.

---

# 7. Backend Validation — IMPORTANT

Use dedicated Laravel Form Request classes.

DO NOT put validation directly inside controllers.

Create:

```text
LoginRequest
StoreHotelRequest
UpdateHotelRequest
```

## StoreHotelRequest

Example rules:

```php
[
    'name' => ['required', 'string', 'max:150'],
    'location' => ['required', 'string', 'max:200'],
    'description' => ['nullable', 'string'],
    'contact_email' => ['nullable', 'email', 'max:255'],
    'status' => ['required', Rule::in(['active', 'inactive'])],
]
```

## UpdateHotelRequest

Use the same appropriate rules for update.

## LoginRequest

```php
[
    'email' => ['required', 'email'],
    'password' => ['required', 'string'],
]
```

Validation errors should return Laravel's normal `422 Unprocessable Entity` JSON response.

---

# 8. Tenant Resolution

The tenant must come from the authenticated user.

Conceptually:

```text
Request
   ↓
Sanctum Authentication
   ↓
Authenticated User
   ↓
User->tenant_id
   ↓
Tenant-scoped operation
```

NEVER trust:

```json
{
  "tenant_id": 999
}
```

from the frontend.

For hotel creation:

```php
Hotel::create([
    'tenant_id' => auth()->user()->tenant_id,
    'name' => $request->name,
    ...
]);
```

The client does not choose the tenant.

---

# 9. Authorization

Use Laravel Policies where appropriate.

Create:

```text
HotelPolicy
```

The policy should ensure that the authenticated user's tenant matches the hotel's tenant.

For example:

```text
User tenant_id = Hotel tenant_id
        ↓
allowed

User tenant_id != Hotel tenant_id
        ↓
denied
```

For cross-tenant resource access, returning `404 Not Found` is preferred when appropriate so that the existence of another tenant's resource is not revealed.

---

# 10. Hotel API

Implement:

```text
GET    /api/hotels
POST   /api/hotels
GET    /api/hotels/{hotel}
PUT    /api/hotels/{hotel}
DELETE /api/hotels/{hotel}
```

All require authentication.

---

# 11. Hotel Listing

Endpoint:

```text
GET /api/hotels
```

Support:

- pagination
- search by hotel name
- optional location search
- optional status filter

Example:

```text
GET /api/hotels?search=grand&status=active&page=1
```

Important:

The query MUST be tenant-scoped before pagination/search/filtering.

Conceptually:

```php
Hotel::where('tenant_id', auth()->user()->tenant_id)
```

then apply filters.

Return a paginated response.

---

# 12. Hotel Creation

Endpoint:

```text
POST /api/hotels
```

Request:

```json
{
  "name": "Grand Hotel",
  "location": "Pune",
  "description": "Business hotel",
  "contact_email": "contact@grandhotel.test",
  "status": "active"
}
```

The backend automatically assigns:

```text
tenant_id = authenticated user's tenant_id
```

Do not accept or trust tenant_id from the request.

Return:

```text
201 Created
```

---

# 13. Hotel Details

Endpoint:

```text
GET /api/hotels/{id}
```

The resource must belong to the authenticated user's tenant.

If it belongs to another tenant:

```text
404 Not Found
```

---

# 14. Hotel Update

Endpoint:

```text
PUT /api/hotels/{id}
```

Before updating:

1. authenticate user
2. identify user's tenant
3. verify hotel belongs to same tenant
4. validate request
5. update hotel

Return:

```text
200 OK
```

---

# 15. Hotel Delete

Endpoint:

```text
DELETE /api/hotels/{id}
```

Verify tenant ownership before deleting.

Return:

```text
204 No Content
```

---

# 16. Hotel Service

Create:

```text
HotelService.php
```

Use it for business operations such as:

```text
listHotels()
createHotel()
getHotel()
updateHotel()
deleteHotel()
```

The service should receive the tenant context from the authenticated user or a clearly defined tenant-aware abstraction.

Keep the implementation simple.

Do not build a complicated generic repository system.

---

# 17. API Resources

Use:

```text
HotelResource
TenantResource
UserResource
```

Example hotel response:

```json
{
  "id": 1,
  "name": "Grand Hotel",
  "location": "Pune",
  "description": "Business hotel",
  "contact_email": "contact@grandhotel.test",
  "status": "active",
  "created_at": "2026-09-11T10:00:00Z"
}
```

Never expose:

```text
password
tokens
internal security fields
```

---

# 18. Backend Error Handling

Use consistent HTTP status codes:

```text
200 OK
201 Created
204 No Content
401 Unauthorized
403 Forbidden
404 Not Found
422 Unprocessable Entity
500 Internal Server Error
```

Validation response:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": [
      "The name field is required."
    ]
  }
}
```

Do not expose stack traces or internal implementation details.

---

# 19. React + TypeScript Frontend

Build a small, polished and responsive SPA.

Screens:

```text
Login
Dashboard / Hotels
Create Hotel
Edit Hotel
```

Keep the UI simple and professional.

Do NOT spend most of the assessment time on visual design.

---

# 20. Recommended Frontend Structure

```text
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   └── hotels/
│       ├── HotelForm.tsx
│       ├── HotelTable.tsx
│       ├── HotelFilters.tsx
│       └── HotelDeleteDialog.tsx
│
├── pages/
│   ├── LoginPage.tsx
│   └── HotelsPage.tsx
│
├── services/
│   ├── api.ts
│   └── hotelService.ts
│
├── types/
│   ├── auth.ts
│   ├── hotel.ts
│   └── api.ts
│
├── hooks/
│   └── useAuth.ts
│
├── App.tsx
└── main.tsx
```

Adjust only if the chosen React setup requires a different structure.

---

# 21. TypeScript Types

Do not use `any` unnecessarily.

Example:

```ts
export type HotelStatus = 'active' | 'inactive';

export interface Hotel {
  id: number;
  name: string;
  location: string;
  description: string | null;
  contact_email: string | null;
  status: HotelStatus;
  created_at: string;
}
```

Create types for:

```text
Tenant
User
LoginRequest
LoginResponse
Hotel
Pagination
ApiError
```

---

# 22. Simple Professional UI

Use a clean dashboard style.

### Layout

```text
------------------------------------------------
| Hotel Manager                    User | Logout |
------------------------------------------------
|
| Hotels
|
| [ Search hotels... ] [ Status ▼ ] [ + Add Hotel ]
|
| ------------------------------------------------
| Name          Location      Status     Actions |
| ------------------------------------------------
| Grand Hotel   Pune          Active     Edit ...|
| City Hotel    Mumbai        Active     Edit ...|
| ------------------------------------------------
|
|             < 1 2 3 >
```

### Design principles

- clean spacing
- readable typography
- subtle borders
- consistent buttons
- responsive table
- clear status badges
- simple modal/form for create/edit
- confirmation before delete
- good empty state
- good loading state
- clear error messages

Avoid excessive animations and unnecessary UI components.

---

# 23. Hotel Form

Create ONE reusable component:

```text
HotelForm.tsx
```

It should support both:

```text
Create
Edit
```

Fields:

```text
Hotel Name
Location
Description
Contact Email
Status
```

Show:

- required-field errors
- API validation errors
- loading state
- submit state

Disable submit while saving.

---

# 24. Frontend API Layer

Create:

```text
services/api.ts
services/hotelService.ts
```

Do not put API calls directly inside every component.

Example:

```text
hotelService.getHotels()
hotelService.createHotel()
hotelService.updateHotel()
hotelService.deleteHotel()
```

Use a single configured Axios client.

---

# 25. Frontend State

Do not introduce Redux unless the implementation genuinely needs it.

For this small application, local React state and custom hooks are sufficient.

Use:

```text
useState
useEffect
useMemo
custom hooks where useful
```

Keep state close to where it is needed.

---

# 26. Frontend States

Every API-driven screen should handle:

### Loading

```text
Loading hotels...
```

### Empty

```text
No hotels found.
Create your first hotel to get started.
```

### Error

```text
Unable to load hotels.
[Try again]
```

### Success

Show a lightweight success notification after:

```text
Hotel created
Hotel updated
Hotel deleted
```

---

# 27. Search, Filter and Pagination

The Hotels page should support:

```text
Search
Status filter
Pagination
```

Example:

```text
Search: [Grand Hotel       ]
Status: [All ▼]
```

Use server-side filtering and pagination through the Laravel API.

---

# 28. Automated Backend Tests

Tests are a major part of the assessment.

Use Laravel Feature tests.

Minimum tests:

## Authentication

```text
✓ valid user can login
✓ invalid credentials return 401
```

## Hotel creation

```text
✓ authenticated tenant can create hotel
✓ tenant_id is automatically assigned
✓ invalid hotel data returns 422
```

## Tenant isolation — CRITICAL

```text
✓ tenant sees only its own hotels
✓ tenant cannot view another tenant's hotel
✓ tenant cannot update another tenant's hotel
✓ tenant cannot delete another tenant's hotel
```

## CRUD

```text
✓ hotel can be updated
✓ hotel can be deleted
✓ missing hotel returns 404
```

---

# 29. Critical Tenant Isolation Test

Create:

```text
Tenant A
  Hotel A

Tenant B
  Hotel B
```

Authenticate as Tenant A.

Verify:

```text
GET /api/hotels
```

returns only:

```text
Hotel A
```

Then attempt:

```text
GET /api/hotels/{Hotel B ID}
```

Expected:

```text
404
```

Attempt:

```text
PUT /api/hotels/{Hotel B ID}
```

Expected:

```text
404
```

Attempt:

```text
DELETE /api/hotels/{Hotel B ID}
```

Expected:

```text
404
```

These tests demonstrate that the backend—not the UI—is enforcing tenant isolation.

---

# 30. Seed Data

Create factories and seeders.

Create:

```text
Tenant A
Tenant B
```

Users:

```text
admin@tenant-a.test
admin@tenant-b.test
```

Create 2–3 hotels for each tenant.

Example:

```text
Tenant A
  Grand Hotel
  City Hotel

Tenant B
  Beach Resort
  Mountain Resort
```

Document development credentials in README.

Never commit real credentials.

---

# 31. README

Create a professional README.

Sections:

```text
# Multi-Tenant Hotel Management System

## Overview
## Features
## Tech Stack
## Architecture
## Database Design
## Multi-Tenancy Strategy
## API Endpoints
## Setup
## Environment Variables
## Seed Data
## Test Credentials
## Running Tests
## Technical Decisions
## Assumptions
## Security Considerations
## Future Improvements
```

---

# 32. Technical Decision — Multi-Tenancy

Document this decision clearly:

> The application uses a shared MySQL database with row-level tenant isolation through `tenant_id`. Each authenticated user belongs to one tenant, and tenant-owned resources are always queried within the authenticated user's tenant context. The client does not control tenant selection. This approach provides a simple and cost-effective design for the scope of the application while keeping the tenant boundary enforced at the backend level.

Also mention alternatives:

```text
Shared DB + tenant_id
Separate schemas
Separate databases
```

Explain that separate schemas/databases could be considered for stronger isolation or different scale/compliance requirements.

---

# 33. SOLID / Maintainability

Apply principles practically rather than artificially.

### Single Responsibility

Examples:

```text
Form Request → validation
Controller → HTTP coordination
Service → business logic
Resource → API representation
Policy → authorization
Model → persistence/relationships
```

### Don't over-engineer

Do NOT create:

```text
RepositoryInterface
GenericRepository
GenericCrudService
```

unless there is a real requirement.

The goal is clean code that a reviewer can understand quickly.

---

# 34. Security

Consider:

- authentication
- authorization
- tenant isolation
- backend validation
- mass-assignment protection
- password hashing
- API token protection
- rate limiting where appropriate
- no secrets in source control
- no sensitive information in logs/errors
- CORS configuration
- HTTPS in production

Most importantly:

> A malicious user changing an ID in the URL must not gain access to another tenant's data.

---

# 35. Production Considerations

Document, but do not necessarily implement, future improvements:

```text
Role-based permissions
Audit logs
Rate limiting
Monitoring
Centralized logging
CI/CD
Caching
Background jobs
Advanced search
Soft deletes
Database optimization
Security review
Automated frontend tests
```

---

# 36. AI Coding Tool Usage

AI tools such as GitHub Copilot and Amazon Q can be used.

Use them for:

- boilerplate
- migrations
- model relationships
- test scaffolding
- TypeScript types
- debugging
- refactoring
- documentation

But review every generated change.

Before final submission:

```text
Run tests
Check tenant isolation
Check validation
Check authentication
Check authorization
Check API responses
Check frontend error states
Check mobile/responsive UI
Review code manually
```

You must be able to explain the architecture and important code decisions.

---

# 37. Time Management — 2 to 3 Hours

Prioritize in this order:

### 0–15 min

Project setup.

### 15–40 min

Database:

```text
tenants
users
hotels
migrations
models
factories
seeders
```

### 40–80 min

Backend:

```text
Authentication
Form Requests
Hotel CRUD
Tenant isolation
Policies
Service
Resources
```

### 80–105 min

Automated tests:

```text
CRUD
validation
tenant isolation
authentication
```

### 105–135 min

React:

```text
Login
Hotels list
Search/filter
Create/edit
Delete
```

### 135–150 min

UI polish.

### 150–165 min

README + final cleanup.

If time is running out, prioritize:

```text
Tenant isolation
Validation
Tests
Clean backend
Working React UI
README
```

over visual extras.

---

# 38. Definition of Done

Before submitting, verify:

- [ ] Laravel backend works
- [ ] React TypeScript frontend works
- [ ] Login works
- [ ] User belongs to a tenant
- [ ] Tenant has multiple hotels
- [ ] Hotel CRUD works
- [ ] Search works
- [ ] Status filter works
- [ ] Pagination works
- [ ] Form Request validation is implemented
- [ ] Tenant ID comes from authenticated user
- [ ] Cross-tenant GET is blocked
- [ ] Cross-tenant UPDATE is blocked
- [ ] Cross-tenant DELETE is blocked
- [ ] Automated tests pass
- [ ] Factories/seeders work
- [ ] UI handles loading/error/empty states
- [ ] UI is responsive
- [ ] README is complete
- [ ] `.env` is not committed
- [ ] No secrets are committed
- [ ] Code is clean and understandable

---

# 39. Final Review Checklist

Before presenting the project, be prepared to explain these five decisions:

### 1. Why shared database + tenant_id?

Simple, cost-effective, and suitable for the scope.

### 2. How do you prevent cross-tenant access?

Tenant is derived from the authenticated user and every tenant-owned query is scoped accordingly.

### 3. Why Form Requests?

Validation is separated from controllers and can be reused/tested cleanly.

### 4. Why Service layer?

It keeps business logic out of controllers and makes the code easier to maintain.

### 5. What proves tenant isolation works?

Automated tests specifically attempt cross-tenant read, update, and delete operations and verify they are rejected.

The final project should look like a small but realistic production feature—not a large demo application.
