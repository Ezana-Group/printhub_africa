# PrintHub Testing

## Setup

1. **Test database**  
   Copy `.env.test.example` to `.env.test` and set `DATABASE_URL` to a **separate test database** (e.g. `printhub_test`).  
   **Never run tests against production.**

2. **Seed test data**  
   For E2E tests, seed the test DB with the same seed as dev:
   ```bash
   # Use test DB (load .env.test first, or set DATABASE_URL)
   npm run db:push
   npm run db:seed
   ```

3. **Playwright browsers** (one-time)  
   ```bash
   npx playwright install
   ```

## Commands

| Script | Description |
|--------|-------------|
| `npm run test` | Jest unit/integration tests |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:e2e` | Playwright E2E (start app with `npm run dev` first) |
| `npm run test:e2e:ui` | Playwright with UI mode |
| `npm run test:all` | Jest then Playwright |
| `npm run test:lf-engine` | Large Format calculator engine (tsx) |

## E2E (Playwright)

- **Base URL:** `http://localhost:3000`  
- Start the app: `npm run dev`  
- Run: `npm run test:e2e`  
- Config: `playwright.config.ts` (Chrome, Firefox, WebKit; screenshot/video on failure; 2 retries; 4 workers).

### Helpers (`tests/helpers/`)

- `loginAsAdmin(page)` — Super Admin
- `loginAsStaff(page, email)` — Staff (e.g. `sales@printhub.africa`)
- `loginAsCustomer(page, email)` — Customer (e.g. `customer@printhub.africa`)
- `createTestQuote(request, type, overrides?)` — Create quote via API (use `page.request()` after customer login)
- `cleanupTestData()` — Placeholder; implement with test DB reset or test-only API if needed.

### Test accounts (from seed)

See `TEST_ACCOUNTS.md` for emails and passwords (e.g. Super Admin, Staff, Customer).
