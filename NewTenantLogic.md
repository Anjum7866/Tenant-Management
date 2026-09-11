## BUSINESS DOMAIN — TENANT MANAGEMENT SYSTEM

Build the application as a professional Multi-Tenant Tenant Management System (TMS) designed for landlords and property managers.

The system should centralize rental operations, tenant management, leasing, rent collection, maintenance, documents, and communication.

IMPORTANT:
The application should feel like a real SaaS product, but the MVP must remain achievable within a 2–3 hour development window. Prioritize clean architecture, tenant isolation, core workflows, and a polished UI over implementing every advanced feature completely.

---

## 1. USER ROLES

Support these basic roles:

### Super Admin
- Manage all tenants/organizations.
- View tenant organizations.
- Activate/deactivate organizations.
- View high-level system statistics.

### Property Manager / Landlord
- Manage properties.
- Manage units.
- Manage tenants.
- Manage leases.
- Track rent payments.
- Manage maintenance requests.
- Upload/manage documents.
- Communicate with tenants.

### Tenant
- View their assigned property/unit.
- View lease information.
- View rent/payment history.
- View outstanding rent.
- Submit maintenance requests.
- View maintenance request status.
- View/download relevant documents.
- Communicate with property management.

For the MVP, implement the Property Manager and Tenant workflows first.
Super Admin functionality can be kept minimal.

---

# 2. CORE BUSINESS FLOW

The main business flow should be:

Organization/Tenant
        ↓
Properties
        ↓
Units
        ↓
Tenants
        ↓
Lease
        ↓
Rent / Payments
        ↓
Maintenance Requests
        ↓
Documents
        ↓
Communication

Example:

A property manager logs into their organization dashboard.

1. Creates a property.
2. Adds units under that property.
3. Adds a tenant.
4. Assigns the tenant to a unit.
5. Creates a lease for the tenant.
6. System tracks monthly rent.
7. Tenant can view rent status.
8. Tenant can submit maintenance requests.
9. Property manager receives and manages the request.
10. Manager updates the request status.
11. Tenant can see the updated status.

---

# 3. PROPERTY MANAGEMENT

Property managers should be able to:

- Create property
- Edit property
- View property
- Delete property
- Search properties
- Filter properties by status

Property fields:

- Property Name
- Property Type
- Address
- City
- State
- ZIP/Postal Code
- Description
- Status

Property types:

- Apartment
- House
- Commercial
- Villa
- Other

---

# 4. UNIT MANAGEMENT

Each property can contain multiple units.

Example:

Property:
Sunrise Apartments

Units:
- A-101
- A-102
- A-103
- A-104

Unit fields:

- Unit Number
- Property
- Floor
- Bedrooms
- Bathrooms
- Monthly Rent
- Status

Unit status:

- Available
- Occupied
- Maintenance

A unit can be assigned to only one active tenant/lease at a time.

---

# 5. TENANT MANAGEMENT

Property managers can:

- Add tenant
- Edit tenant
- View tenant
- Search tenant
- View tenant details
- Assign tenant to a unit
- View tenant's lease
- View rent history
- View maintenance requests

Tenant fields:

- Name
- Email
- Phone
- Address
- Emergency Contact
- Status

Tenant status:

- Active
- Inactive

IMPORTANT:
Tenant data must always be isolated by organization/tenant_id.

A user belonging to Organization A must NEVER be able to see tenants, properties, units, leases, payments, or maintenance requests belonging to Organization B.

---

# 6. LEASE MANAGEMENT

Property managers can create and manage leases.

Lease fields:

- Tenant
- Property
- Unit
- Start Date
- End Date
- Monthly Rent
- Security Deposit
- Lease Status

Lease status:

- Draft
- Active
- Expired
- Terminated

Business rules:

- Only an available unit can receive a new active lease.
- A unit cannot have multiple active leases.
- Tenant should be able to view their active lease.
- Manager should be able to see upcoming lease expirations.

---

# 7. RENT & PAYMENT MANAGEMENT

Implement a simple rent tracking system.

Property manager should be able to:

- View expected monthly rent
- Record payment
- View payment history
- View pending payments
- View overdue payments

Payment fields:

- Tenant
- Lease
- Amount
- Due Date
- Paid Date
- Payment Status
- Payment Reference

Payment status:

- Pending
- Paid
- Overdue
- Partial

IMPORTANT:

For the MVP, DO NOT integrate a real payment gateway.

Create a simple "Record Payment" workflow so the business logic can be demonstrated without external payment integration.

Future enhancement:
Stripe/Razorpay/payment gateway integration.

---

# 8. MAINTENANCE MANAGEMENT

Tenants should be able to create maintenance requests.

Maintenance request fields:

- Title
- Description
- Property
- Unit
- Tenant
- Priority
- Status
- Created Date
- Assigned To
- Resolution Notes

Priority:

- Low
- Medium
- High
- Urgent

Status:

- Open
- In Progress
- Resolved
- Closed

Tenant flow:

Tenant
→ Create maintenance request
→ Manager receives request
→ Manager assigns/updates request
→ Status becomes In Progress
→ Manager resolves issue
→ Tenant can see status as Resolved

Property manager should be able to:

- View all maintenance requests
- Filter by status
- Filter by priority
- Update status
- Add resolution notes
- Assign request

---

# 9. DOCUMENT MANAGEMENT

Allow managers to associate documents with tenants or leases.

Examples:

- Lease Agreement
- ID/Verification Document
- Property Document
- Payment Receipt
- Other

For the MVP:

- Store document metadata.
- Allow upload if time permits.
- Associate document with tenant/lease.
- Allow users to view/download authorized documents.

IMPORTANT:
Users must only access documents belonging to their organization.

Never expose files belonging to another organization.

---

# 10. COMMUNICATION

Implement a simple communication model.

For the MVP:

- Tenant can send a message/request to property manager.
- Manager can reply.
- Messages should belong to a tenant/organization.
- Display messages in a simple conversation-style UI.

Do NOT implement real-time WebSockets for the MVP.

Future enhancement:
Real-time notifications using WebSockets/Pusher.

---

# 11. DASHBOARD

Create a clean professional dashboard.

Property Manager Dashboard should show:

- Total Properties
- Total Units
- Occupied Units
- Available Units
- Active Tenants
- Monthly Expected Rent
- Pending Payments
- Overdue Payments
- Open Maintenance Requests

Example:

┌──────────────────┐ ┌──────────────────┐
│ Total Properties │ │ Total Units      │
│       12         │ │       86         │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Active Tenants   │ │ Pending Rent     │
│       72         │ │    ₹1,25,000     │
└──────────────────┘ └──────────────────┘

Below the cards:

Recent Maintenance Requests
Recent Payments
Upcoming Lease Expirations

Keep the dashboard simple and professional.

---

# 12. TENANT DASHBOARD

Tenant dashboard should show:

- Current Property
- Current Unit
- Monthly Rent
- Next Due Date
- Current Payment Status
- Active Lease
- Open Maintenance Requests
- Recent Messages
- Recent Documents

Example:

"My Apartment"
Unit: A-102

Monthly Rent: ₹25,000
Next Due: 5th September
Status: Paid

[View Lease]

Maintenance
- AC not working — In Progress
- Bathroom leakage — Resolved

---

# 13. MULTI-TENANCY ARCHITECTURE

Use a shared database with row-level tenant isolation.

Main organization table:

tenants

Each business/customer is represented as a tenant organization.

Tables should contain tenant_id where appropriate:

- users
- properties
- units
- tenants/users depending on naming strategy
- leases
- payments
- maintenance_requests
- documents
- messages

IMPORTANT SECURITY RULE:

Never accept tenant_id from the frontend as a trusted value.

Determine the organization from the authenticated user's context.

Example:

Authenticated User
        ↓
user.tenant_id
        ↓
Query only records belonging to tenant_id

Bad:

GET /api/properties?tenant_id=2

Good:

GET /api/properties

Backend automatically applies:

WHERE tenant_id = authenticatedUser.tenant_id

---

# 14. API DESIGN

Use RESTful Laravel APIs.

Authentication:

POST /api/login
POST /api/logout
GET /api/me

Dashboard:

GET /api/dashboard

Properties:

GET /api/properties
POST /api/properties
GET /api/properties/{id}
PUT /api/properties/{id}
DELETE /api/properties/{id}

Units:

GET /api/units
POST /api/units
GET /api/units/{id}
PUT /api/units/{id}
DELETE /api/units/{id}

Tenants:

GET /api/tenants
POST /api/tenants
GET /api/tenants/{id}
PUT /api/tenants/{id}

Leases:

GET /api/leases
POST /api/leases
GET /api/leases/{id}
PUT /api/leases/{id}

Payments:

GET /api/payments
POST /api/payments
GET /api/payments/{id}

Maintenance:

GET /api/maintenance
POST /api/maintenance
GET /api/maintenance/{id}
PUT /api/maintenance/{id}

Documents:

GET /api/documents
POST /api/documents
GET /api/documents/{id}

Messages:

GET /api/messages
POST /api/messages

---

# 15. BACKEND CODE QUALITY

Use clean Laravel architecture:

Request
   ↓
Controller
   ↓
Service
   ↓
Model
   ↓
Database

Use Laravel Form Request classes for validation.

Examples:

LoginRequest
StorePropertyRequest
UpdatePropertyRequest
StoreUnitRequest
UpdateUnitRequest
StoreTenantRequest
StoreLeaseRequest
StorePaymentRequest
StoreMaintenanceRequest

Do NOT put large validation arrays directly inside controllers.

Use:

- Form Requests
- Policies
- Services
- API Resources
- Eloquent relationships
- Scopes where useful
- Database transactions for important operations

Keep controllers thin.

Example:

PropertyController
→ validates request
→ calls PropertyService
→ returns PropertyResource

Business logic should not be duplicated across controllers.

---

# 16. AUTHORIZATION

Use Laravel Policies or equivalent authorization.

Examples:

PropertyPolicy
UnitPolicy
LeasePolicy
MaintenanceRequestPolicy
DocumentPolicy

Every resource must verify:

1. User is authenticated.
2. User has permission for the action.
3. Resource belongs to the authenticated organization.

Cross-tenant access should return 404 where appropriate rather than exposing that another organization's resource exists.

---

# 17. DATABASE RELATIONSHIPS

Use proper Eloquent relationships.

Example:

Tenant
hasMany Properties

Property
hasMany Units

Unit
hasMany Leases

Lease
belongsTo Tenant
belongsTo Property
belongsTo Unit

Tenant
hasMany Payments

Tenant
hasMany MaintenanceRequests

Lease
hasMany Payments

Property
hasMany MaintenanceRequests

Use foreign keys and indexes appropriately.

Add indexes to frequently filtered columns such as:

tenant_id
status
email
property_id
unit_id
lease_id

---

# 18. REACT + TYPESCRIPT UI

Build a very simple but professional UI.

Use:

- React
- TypeScript
- React Router
- Axios/fetch
- CSS/Tailwind/Bootstrap based on project setup

Pages:

/login
/dashboard
/properties
/properties/:id
/units
/tenants
/leases
/payments
/maintenance
/documents
/messages

Tenant pages can be simplified based on role.

---

# 19. UI DESIGN PRINCIPLES

Do NOT make the UI overly complicated.

Focus on:

- Clean sidebar
- Simple top navigation
- Professional dashboard cards
- Tables
- Search
- Filters
- Pagination
- Status badges
- Modal/forms where appropriate
- Confirmation before destructive actions
- Loading states
- Empty states
- Error messages
- Success notifications
- Responsive design

Use consistent:

- spacing
- typography
- buttons
- form controls
- table design
- status badges

The UI should look like a professional SaaS admin dashboard, not a basic CRUD demo.

---

# 20. MVP PRIORITY

Because the project must be completed within a limited time, implement features in this order:

P0 — MUST HAVE

1. Authentication
2. Multi-tenant isolation
3. Property CRUD
4. Unit management
5. Tenant management
6. Clean Laravel architecture
7. Form Request validation
8. Policies/authorization
9. React TypeScript UI
10. Dashboard

P1 — IMPORTANT

11. Lease management
12. Maintenance requests
13. Rent/payment tracking

P2 — IF TIME PERMITS

14. Documents
15. Messaging
16. Advanced filtering
17. Notifications
18. File uploads

Do NOT sacrifice multi-tenant security or code quality to implement P2 features.

---

# 21. TESTING

Write feature tests for the most important business rules.

Minimum tests:

- Login succeeds with valid credentials.
- Login fails with invalid credentials.
- User can only see properties from their organization.
- User cannot access another organization's property.
- User can create a property.
- Property validation works.
- User can create a unit.
- Tenant can only see their own information.
- Tenant cannot access another organization's data.
- Only available units can receive a new active lease.
- Tenant can create maintenance request.
- Manager can update maintenance status.
- Unauthorized users cannot perform restricted actions.

Multi-tenant isolation tests are the highest priority.

---

# 22. DEMO DATA

Create realistic seed data.

Organization A:
"Sunrise Property Management"

Properties:
- Sunrise Apartments
- Green Valley Residency

Units:
- A-101
- A-102
- B-201
- B-202

Organization B:
"Urban Living Properties"

Properties:
- Downtown Heights

Units:
- 101
- 102

Create users for both organizations.

IMPORTANT:

During demonstration, show that logging in as Organization A cannot access Organization B's data.

This is the key demonstration of multi-tenancy.

---

# 23. README

The README must explain:

- Project overview
- Business problem
- Features
- Tech stack
- Architecture
- Multi-tenancy approach
- Database design
- Authentication
- Authorization
- API documentation
- Setup instructions
- Environment configuration
- Seed credentials
- Running tests
- Key technical decisions
- Security considerations
- Future improvements

Include a simple architecture diagram using Markdown.

Example:

React + TypeScript
        ↓
Laravel REST API
        ↓
Authentication / Policies
        ↓
Services
        ↓
Eloquent Models
        ↓
Shared Database
        ↓
tenant_id isolation

---

## FINAL GOAL

The final application should demonstrate that the developer understands:

- Multi-tenant SaaS architecture
- Laravel REST API development
- Form Request validation
- SOLID principles
- Service-based business logic
- Authorization and Policies
- Database relationships
- Row-level tenant isolation
- React + TypeScript
- API integration
- Role-based UI
- Clean code
- Testing
- Professional product thinking

The project should be intentionally simple in scope but professional in architecture and presentation.

Avoid over-engineering.

The interviewer should be able to open the repository and quickly understand:

1. What problem the application solves.
2. How multi-tenancy works.
3. How authentication works.
4. How authorization works.
5. Where validation happens.
6. Where business logic lives.
7. How React communicates with Laravel.
8. How tenant data is protected.
9. How the application can be extended in the future.