# EventHub Complete Local Project — Provider + Admin

This package contains the complete EventHub local MVP plus the next milestone from the
Technical Requirement Brief: Admin verification and marketplace management.

## Included

- Customer/provider authentication
- Provider onboarding/profile
- Provider business title, logo, and social profile links
- Provider marketplace
- Provider dashboard
- Enquiries and quote submission
- Booking lifecycle
- Provider availability
- Reviews
- Provider reputation fields
- Customer planner shortlist with notes and final-choice status
- Customer event brief and multi-provider quote requests
- User settings for account details, password security, and notification preferences
- Admin dashboard
- Admin customer/provider account enablement
- Provider verification
- Service category management
- Service catalog management
- Reported review moderation

## Run

To run the full stack with Docker:

```powershell
cd C:\path\to\eventhub_complete_next
docker compose up --build
```

To run the frontend directly during development:

```powershell
cd C:\path\to\eventhub_complete_next\frontend
npm install
npm start
```

`npm start` runs the Vite development server on all network interfaces (equivalent to `npm run dev`). Start the backend separately, listening on `0.0.0.0:8000`.

### Access from another laptop on your local network

1. Connect both laptops to the same trusted Wi-Fi or LAN.
2. On the host laptop, start the full stack with `docker compose up --build` from the project directory. The frontend and API containers listen on all interfaces.
3. Find the host laptop's private IPv4 address in PowerShell:

   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.InterfaceOperationalStatus -eq "Up" } | Select-Object InterfaceAlias, IPAddress
   ```

4. If Windows Firewall prompts, allow Docker/Node/Python access on **Private networks only**. If needed, add inbound TCP rules for ports `5173` (frontend) and `8000` (API), restricted to the Private profile. Do not expose these ports through your router or to public networks.
5. On the other laptop, open `http://<host-private-ip>:5173` (for example, `http://192.168.1.25:5173`). The frontend automatically sends API requests to that same host on port `8000`.

The frontend and API use unencrypted HTTP and the compose file contains development credentials. Use this only on a trusted local network; change the default credentials and secrets before using real data.

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
9. Any logged-in customer can select a 1–5-star rating and leave or update a comment on a provider profile. Reviews are listed publicly and update the provider's average rating.
10. Customers can also review completed bookings through the booking review API.
11. Admin can moderate reported reviews.
12. Admin can enable or disable customer and service-provider accounts from the Accounts tab. Disabled accounts cannot log in, existing sessions are rejected, and disabled provider listings are hidden from the marketplace.
13. Customers can shortlist planners from the marketplace, add planning notes in My planner dashboard, and mark one active planner as their final choice.
14. Signed-in users can open Settings from the left-side hamburger navigation. Settings shows section links and account details in a left sidebar, with the selected profile, security, or notification controls beside it.
15. Customers can use **Plan an event** to submit the event type, date, location, guest count, budget, service needs, and notes to one or more selected providers. Requests appear in the provider enquiry dashboard, and customers can track provider replies from the event form.
16. Service providers can edit their public listing from the themed, responsive Provider Dashboard → Edit profile screen, including business identity, service, location, service radius, experience, description, starting price and unit, a PNG/JPEG/WebP logo up to 512 KB, and Instagram, Facebook, YouTube, LinkedIn, and website links. Saving edits returns the listing to pending verification.
17. The existing local database now includes 31 additional synthetic provider profiles covering 24 states and Union Territories. They are clearly marked as demo listings, have pending verification, and intentionally have no fabricated contact or social links. To safely seed them again after resetting the database, run `docker compose exec backend python -m app.seed_demo_providers` from this project directory; existing seeded entries are skipped.
18. Customers can use the hamburger sidebar's **Become a service provider** action to create a provider profile on their existing account. Customer planning tools remain enabled, and their new service profile is pending admin verification. The service field accepts any text, including individual services such as mehndi artist, dancer, or event anchor.
19. The header's top-right account icon opens profile/settings and Help/About navigation. Help contains marketplace FAQs; About describes the marketplace and calls out synthetic demo listings.
20. The public home page explains how to find providers, send an event brief, and compare replies. It also highlights the seeded marketplace categories and clearly explains demo listings, verification limits, and that payments/refunds are handled outside this local MVP. Help covers quote, privacy-minded event briefs, cancellations, reviews, account support, and provider-safety guidance. A shared footer links to Providers, Help, and About.
21. The frontend uses a warm celebration palette with an animated, wedding-inspired home hero and service cards. Decorative motion respects the browser's reduced-motion preference.
22. The provider marketplace uses the same celebratory theme, with a responsive search/filter panel, animated decorative accents, clearer verification and pricing presentation, and themed provider cards. Existing search, location/service filters, profile navigation, and shortlist actions are preserved.
23. The navigation drawer matches the celebration theme and starts directly with the Discover section, without a duplicate EventHub heading or signed-in customer welcome card. It retains icon-led role-specific sections and guest login/signup actions, and uses one continuous drawer scrollbar while locking background page scrolling when open.
24. The top-right account menu uses a themed welcome panel and grouped profile/settings/help actions for signed-in users; guests see welcome, sign-in, and account-creation actions. All existing menu destinations are preserved.
25. The header shows a role-aware tagline beneath EventHub ("Make every moment memorable" for customers and "Event service provider" for providers). Signed-in users see their name beside the top-right account icon; the drawer starts at Discover without repeating the brand or customer name and scrolls as one panel.
26. Provider profiles display a themed rating summary with rating-distribution progress bars, customer review cards, and an interactive five-star review selector instead of a rating dropdown.
27. The event-planning page uses a responsive celebration-themed hero and numbered sections for event details, services, notes, and provider selection. Provider cards, selected-provider actions, and sent requests follow the shared berry, gold, and ivory theme while retaining the existing request workflow. Provider results expand in the page flow instead of using a nested scroll area, leaving the page as the single vertical scroll surface.
28. API requests show a delayed, app-wide loading overlay when work takes more than a brief moment. Successful create/update/delete actions show contextual toast notifications; API errors remain visible through an error toast and the screen's existing error handling.

## Architecture note

The brief recommends React + TypeScript + Tailwind, Node.js + TypeScript, PostgreSQL and Prisma.
This local package retains the existing FastAPI + PostgreSQL implementation so it remains compatible
with the project built in the previous step. The admin/business workflow is implemented on top of it.

## Frontend structure

The React frontend is organized by responsibility so features can be changed without editing one
large entry file:

- `frontend/src/App.tsx` coordinates page state and connects pages to shared actions.
- `frontend/src/api/client.ts` centralizes API requests and bearer-token handling.
- `frontend/src/components/` contains shared interface elements such as navigation.
- `frontend/src/pages/` contains sign-in, signup, profile, settings, event-request, Help, and About pages.
- `frontend/src/features/marketplace/` contains provider search and public profiles.
- `frontend/src/features/customer/` contains planner shortlist workflows.
- `frontend/src/features/provider/` contains provider tools and profile editing.
- `frontend/src/features/admin/` contains administration screens and catalog actions.
- `frontend/src/main.tsx` is only the browser entry point; `style.css` contains global styles.

Keep new page-specific behavior in its feature folder, use `components/` for shared UI, and add
backend communication through `api/client.ts` rather than duplicating fetch/token logic.

## Product requirements and Copilot guidance

- [EventHub product and feature specification](./docs/eventhub-product-spec.md) contains feature requirements, acceptance scenarios, entities, and Mermaid data-flow diagrams.
- [EventHub Product Engineer agent](./.github/agents/eventhub-product.agent.md) provides repository-specific implementation guidance.
- [EventHub product skill](./.github/skills/eventhub-product/SKILL.md) provides the feature-tracing and documentation workflow.
