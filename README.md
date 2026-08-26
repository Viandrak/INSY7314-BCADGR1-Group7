# HustleHub+

**Part 1 — Secure Backend Foundations - INSY7314**

HustleHub+ is a secure freelance marketplace platform that allows freelancers to advertise their services aS well as clients to browse and book them. Beyond standard marketplace functionality, the platform records financial transactions generated through bookings along with provides freelancers with an indication of income earned and estimated tax obligations.

Because the platform processes sensitive information — user credentials, transactional records, and income-related data — security has been treated as a primary design concern from the outset rather than added afterward (OWASP Foundation, 2023).

This repository is developed incrementally across three parts:

| Part | Focus | Status |
|------|-------|--------|
| **Part 1** | Secure backend foundations | ✅ This submission |
| **Part 2** | Full-stack application development | 🔲 Upcoming |
| **Part 3** | DevSecOps, monitoring, and finalisation | 🔲 Upcoming |

---

## System overview

HustleHub+ is designed around the MERN stack — MongoDB, Express, React, and Node.js. The MERN architecture was selected because it allows the development team to use JavaScript across both the frontend and backend, supporting consistent development conventions and data handling across the application.

Part 1 focuses specifically on establishing a secure API for user registration and authentication, which forms the foundation that every later feature — gig management, bookings, transactions, and income tracking — will build on top of. At this stage, user data is stored using a temporary in-memory structure, as explicitly permitted by the project brief. A MongoDB database will be introduced in a later part.

## Intended users

HustleHub+ supports three distinct user roles, each with different permissions and views once role-based access control is fully implemented:

| Role | Description | Key capabilities |
|------|--------------|-------------------|
| **Client** | A user looking to hire freelance services | Browse available gigs, book services, view booking history |
| **Freelancer** | A user offering services on the platform | Advertise gigs, manage bookings, track income along with estimated tax obligations |
| **Admin** | Platform administrator | Oversee platform activity, manage users (full functionality introduced in later parts) |

Designing around these three roles from the start — rather than adding role distinctions later — ensures that access control decisions are consistent across every endpoint as the platform grows.

## Architecture

The system is designed around a React frontend that will communicate with the Express backend using a REST API with JSON over HTTPS.

All security-relevant logic is designed to sit inside the backend's **trust boundary** before any data reaches storage: input validation, JWT authentication, role-based access control, route handling, password hashing, and centralised error handling. A trust boundary is a standard security architecture concept marking the point where data crosses from a less trusted context (the client) into a more trusted, controlled one (the server) (OWASP Foundation, 2023). Structuring the system around an explicit trust boundary makes it clear, at a glance, exactly which parts of the application are responsible for enforcing security — rather than leaving those responsibilities implicit or scattered across the codebase.

The registration endpoint includes required-field checks and case-insensitive duplicate-user detection. Passwords are hashed using bcrypt before being stored, ensuring plaintext passwords are never retained at any point. Login is handled via JWT-based authentication: on successful login, the backend issues a token containing the user's ID and role, which is required on all subsequent requests to protected routes. Role-based access control and centralised error handling middleware ensure that access is restricted appropriately by role and that errors are returned in a safe, consistent format that does not expose internal system details.

## Backend structure

The backend follows a modular Express structure with clear separation of concerns. Each folder has a single, well-defined responsibility, which keeps the codebase easy to navigate, test, and extend as new features (gigs, bookings, transactions) are added in later parts:

| Folder | Responsibility |
|--------|-----------------|
| `src/routes` | Defines API endpoints and maps them to controllers |
| `src/controllers` | Handles request/response logic for each route |
| `src/models` | Defines data structures (temporary in-memory storage for Part 1) |
| `src/services` | Reusable business logic, such as password hashing |
| `src/middleware` | Cross-cutting request handling, such as authentication checks and validation |
| `src/utils` | Shared helpers, including a consistent response format used across all endpoints |

This structure keeps each layer focused on one job: routes handle *where* a request goes, controllers handle *what* happens to it, services and models handle the *underlying logic and data*, and utilities keep shared behaviour — like response formatting — consistent everywhere it's used.

## Request flow

The current registration flow follows five steps. Once Person 3's validation middleware and Person 2's authentication middleware are integrated, this will expand to a full request pipeline: route → validation/sanitisation middleware → authentication/authorisation middleware (where required) → controller → service/model → response.

1. **Request initiated** — the frontend sends a request over HTTPS to an endpoint such as `POST /api/auth/register`
2. **Routing** — Express routes the request to the relevant controller
3. **Validation and checks** — the controller performs the applicable request checks, such as required-field and duplicate-email checks
4. **Business logic** — on success, the controller calls the relevant service (e.g. password hashing) and model function
5. **Response** — a consistent JSON response is returned, using a shared `success`/`message` format so the frontend can handle every response the same way, regardless of endpoint

Keeping this flow consistent across every endpoint means that as new features are added in Part 2, they follow the exact same pattern — reducing the chance of inconsistent error handling or response shapes creeping into the API over time.

## Security decisions

<!-- Person 2: add your section here explaining password hashing, JWT, and HTTPS decisions, with appropriate sources -->

<!-- Person 3: add your section here explaining input validation, sanitisation, and error handling decisions -->

## Setup

1. Clone the repository
2. Run `npm install` inside `/backend`
3. Copy `.env.example` to `.env`
4. Run `npm run dev` to start the server

## API testing

<!-- Person 3: add a short summary here of the Postman collection and what scenarios it covers -->

---

## Team

**Group 7**

- Viandra Kistasamy — ST10445089
- Kaitlyn Pillay — ST10437630
- Nikkita Ramsumair — ST10445383

---

## References

Motdotla, 2024. *dotenv - Loads environment variables from .env file.*
[Online] Available at: https://www.npmjs.com/package/dotenv
[Accessed 26 August 2026].

OpenJS Foundation, 2024. *Express — Node.js web application framework.*
[Online] Available at: https://expressjs.com/en/4x/api.html
[Accessed 26 August 2026].

OWASP Foundation, 2023. *REST Security Cheat Sheet.*
[Online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
[Accessed 26 August 2026].
