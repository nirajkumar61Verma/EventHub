# EventHub Complete Local Project — Provider + Admin

This package contains the complete EventHub local MVP plus the next milestone from the
Technical Requirement Brief: Admin verification and marketplace management.

## Included

- Customer/provider authentication
- Provider onboarding/profile
- Provider marketplace
- Provider dashboard
- Enquiries and quote submission
- Booking lifecycle
- Provider availability
- Reviews
- Provider reputation fields
- Admin dashboard
- Provider verification
- Service category management
- Service catalog management
- Reported review moderation

## Run

```powershell
cd C:\path\to\eventhub_complete_next
docker compose up --build
```

Open:
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

## Default admin

Email: `admin@eventhub.local`
Password: `Admin@123`

Change these values in `docker-compose.yml` for anything beyond local development.

## Test

1. Create a provider account.
2. Open Provider Dashboard and complete the profile.
3. Login as admin and approve the provider.
4. Create a customer account and use the marketplace.
5. Create/request quotes using the customer flow from the earlier MVP.
6. Provider submits a quote.
7. Customer accepts it.
8. Provider changes booking status to COMPLETED.
9. Customer can review the completed booking through the review API.
10. Admin can moderate reported reviews.

## Architecture note

The brief recommends React + TypeScript + Tailwind, Node.js + TypeScript, PostgreSQL and Prisma.
This local package retains the existing FastAPI + PostgreSQL implementation so it remains compatible
with the project built in the previous step. The admin/business workflow is implemented on top of it.
