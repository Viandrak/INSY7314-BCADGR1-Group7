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

## Table of contents

- [System overview](#system-overview)
- [Intended users](#intended-users)
- [Architecture](#architecture)
- [Backend structure](#backend-structure)
- [Request flow](#request-flow)
- [Security decisions](#security-decisions)
- [Setup](#setup)
- [API testing](#api-testing)
- [Team](#team)
- [References](#references)

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

![HustleHub+ architecture diagram](https://github.com/user-attachments/assets/7a1e8bbf-1b95-48d3-9147-d0e8fe8e532f)

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

## Security Decisions

Security was treated as a core design requirement for the authentication system, not an
afterthought. The following decisions were made to protect user credentials and restrict access
to sensitive functionality:

- **No plain-text passwords are ever stored.** Passwords are hashed using bcrypt before being
  saved, so even if the user store were compromised, the original passwords could not be
  recovered.
- **Stateless authentication via JWT.** Rather than maintaining server-side session state, the
  server issues a signed token after login that the client presents on each subsequent request.
  This keeps the API stateless and scalable, while still allowing routes to verify a user's
  identity and role.
- **Minimal data in the token payload.** Only the user's ID and role are embedded in the JWT —
  never the password hash or other sensitive fields — reducing what could be exposed if a token
  were intercepted or decoded.
- **Consistent, non-revealing error messages.** Login failures return the same generic message
  regardless of whether the email exists or the password is wrong, preventing user enumeration
  attacks.
- **Controlled error handling.** All error responses return a generic message and appropriate
  HTTP status code, without leaking stack traces, file paths, or internal configuration details.
- **Secrets kept out of source control.** The JWT signing secret is loaded from an environment
  variable (`.env`, excluded from git) rather than hard-coded, so it cannot be exposed if the
  repository is shared or made public.
- **Encrypted transport via HTTPS.** All traffic, including credentials and financial data in
  later parts of the system, is encrypted in transit using a locally trusted SSL certificate.

The sections below detail the specific implementation of password hashing, JWT-based
authentication, and HTTPS.

## Password Hashing

User passwords are never stored in plain text. On registration, the password is hashed using
bcrypt with a salt round factor of 10 before being saved to the user store. bcrypt automatically
generates and embeds a unique salt per password, which protects against rainbow table attacks
and ensures that two users with the same password produce different hashes. During login, the
submitted password is compared against the stored hash using bcrypt's built-in comparison
function, which re-derives the hash using the embedded salt rather than ever decrypting it —
password hashes are one-way and cannot be reversed.

## JWT / Token-Based Authentication

After a successful login, the server issues a JSON Web Token (JWT) signed with a secret key held
only on the server (loaded from an environment variable, never hard-coded or committed to
source control). The token payload contains only the user's ID and role — no sensitive data such
as the password hash or email is included. The client includes this token in the `Authorization`
header (`Bearer <token>`) on subsequent requests. Protected routes are guarded by middleware that
verifies the token's signature and expiry before allowing the request to proceed; if verification
fails, the request is rejected with a 401 Unauthorized response. Tokens expire after a configured
period (default 1 hour), limiting the window in which a stolen token could be misused.

## HTTPS

The API is served over HTTPS using a locally generated SSL certificate (via mkcert) rather than
plain HTTP. This encrypts data in transit between client and server, which is essential given
that login requests carry user credentials and protected routes may return financial and
income-related data. Running over HTTPS in development also mirrors how the application would be
deployed in production, where a certificate from a trusted certificate authority would be used
instead of a locally trusted one.

## Input Validation, Sanitisation & Error Handling

All input to the authentication endpoints is validated and sanitised using
`express-validator` before it reaches the controller layer. Email addresses
are trimmed and normalised, and passwords must be at least 8 characters and
contain an uppercase letter, a lowercase letter, and a number, reducing the
risk of weak or malformed credentials being stored. The `role` field is
restricted to `client` or `freelancer` at registration — an `admin` account
cannot be self-registered through the public API, which prevents privilege
escalation at signup. Request bodies are also capped at 10kb to guard
against oversized or malicious payloads.

Validation failures return a `400` response with a single, safe message
using the same `{ success, message }` shape as every other endpoint, so the
frontend can handle every response consistently regardless of which
endpoint it called.

A centralised error-handling middleware sits at the very end of the Express
middleware chain and acts as a final safety net: any error thrown or
rejected anywhere in the application — including malformed JSON bodies —
is caught here, logged server-side for debugging, and converted into a
generic, non-revealing JSON response. No stack traces, file paths, or
internal configuration values are ever returned to the client, addressing
the requirement that error responses must not expose internal system
details (OWASP Foundation, 2023).

## Setup

1. Clone the repository
2. Run `npm install` inside `/backend`
3. Copy `.env.example` to `.env`
4. Generate a local SSL certificate:
   `openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem -days 365`
5. Run `npm run dev` to start the server
6. The API will be available at `https://localhost:<PORT>` 


## API testing

A Postman collection covering successful and failure scenarios for
registration, login, and the protected test route is included at
`HustleHub-Part1.postman_collection.json` (repo root). It contains 15
requests covering: successful registration, duplicate email detection,
missing fields, invalid email format, weak passwords, restricted role
values, malicious/XSS input, malformed JSON bodies, successful login with
JWT token generation, wrong password, nonexistent user, and access to a
protected route with no token, an invalid token, and a valid token.
Screenshots of each request/response pair are available in
`screenshots/`.

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

Auth0 (n.d.) *jsonwebtoken*. 
[Online] Available at: https://www.npmjs.com/package/jsonwebtoken 
[Accessed: 30 August 2026].

Express.js (n.d.) *Express – Node.js web application framework*. 
[Online] Available at: https://expressjs.com/ 
[Accessed: 30 August 2026].

Internet Engineering Task Force (2015) *RFC 7519: JSON Web Token (JWT)*. 
[Online] Available at: https://datatracker.ietf.org/doc/html/rfc7519 
[Accessed: 30 August 2026].

JWT.io (n.d.) *Introduction to JSON Web Tokens*. 
[Online] Available at: https://jwt.io/introduction 
[Accessed: 30 August 2026].


OpenAI, 2026. ChatGPT. OpenAI. [Online] Available at: 
https://chatgpt.com/share/6a92ee02-acf0-83ea-8425-9488bd50c506                             
[Accessed 27 August 2026].

Node.js Foundation (n.d.) *HTTPS | Node.js documentation*. 
[Online] Available at: https://nodejs.org/api/https.html 
[Accessed: 30 August 2026].

npm, Inc. (n.d.) *bcrypt*. 
[Online] Available at: https://www.npmjs.com/package/bcrypt 
[Accessed: 30 August 2026].


