# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Database
npm run db:push      # Apply schema changes to SQLite
npm run db:seed      # Seed with sample attar/oil shop products
npm run db:studio    # Open Prisma Studio (visual DB browser)

# Build
npm run build && npm start
```

No test suite is configured — there are no test files or test scripts.

## Architecture

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite + jsPDF

### Pages
| Route | Purpose |
|---|---|
| `/` | Main POS screen — the primary shopkeeper interface |
| `/admin/login` | Admin login (default: admin / admin123) |
| `/admin` | Admin portal — Products, Categories, Clerks, Bill Config, Settings tabs |
| `/bills` | Bill history with reprint support |

## Auth — Two Separate Systems

**Admin auth** (server-side, httpOnly cookie):
- Sessions via `pos_session` cookie (8h, in-memory `Map` in `src/lib/auth.ts`)
- `SESSION_SECRET` env var used for SHA-256 password hashing (defaults to hardcoded dev value)
- `src/middleware.ts` redirects all `/admin/*` (except `/admin/login`) when unauthenticated
- `ensureDefaultAdmin()` creates `admin`/`admin123` on first run if no AdminUser exists

**Clerk auth** (client-side, localStorage):
- Clerks log in via 4-digit PIN using `ClerkLogin` component
- Active clerk stored in `localStorage` as `clerk_session` JSON
- Clerk name is recorded on bills (`clerkId` field); role is `"clerk"` or `"manager"`

### Key Files
- `src/app/page.tsx` — POS orchestrator: owns all state (cart, numpad, discount, clerk, mode)
- `src/components/BillPanel.tsx` — Left panel: scrollable cart + totals footer
- `src/components/ProductGrid.tsx` — Category tabs + color-coded 5-col product grid
- `src/components/Numpad.tsx` — Numpad (0-9, 00, .) + action buttons (VOID, QTY, BILL, etc.)
- `src/components/ActionBar.tsx` — Bottom bar: SUBTOTAL, DISCOUNT, CASH
- `src/components/ClerkLogin.tsx` — PIN-entry modal for clerk sign-in/switch
- `src/components/ZoomControl.tsx` — UI zoom buttons; `src/lib/useZoom.ts` + `useGlobalZoomKeys.ts` handle zoom state and `Ctrl +/-` shortcuts
- `src/components/KeyboardHelp.tsx` — Keyboard shortcut reference modal
- `src/lib/billUtils.ts` — `generateBillNumber()` + `printBillPDF()` (80mm thermal receipt via jsPDF)
- `src/lib/db.ts` — Prisma singleton safe for Next.js hot reload
- `src/types/index.ts` — Shared TS interfaces: `Product`, `Category`, `Clerk`, `CartItem`, `Bill`, `BillItem`
- `prisma/schema.prisma` — All DB models

### Database Models
```
AdminUser                    — admin credentials (username + SHA-256 hash)
Category → Product           — one-to-many
Bill → BillItem → Product    — bill line items reference products
Clerk                        — name, PIN, role (clerk/manager), active flag
BillConfig                   — single-row shop info + receipt display toggles
```

### API Routes
```
# Auth
POST /api/auth/login          — admin login, sets pos_session cookie
POST /api/auth/logout         — clears cookie
POST /api/auth/change-password

# Categories
GET/POST /api/categories      — list (with nested products) / create
PUT/DELETE /api/categories/[id]

# Products
GET/POST /api/products        — list all / create
PUT/DELETE /api/products/[id]

# Bills
GET/POST /api/bills           — bill history / create bill + save to DB
GET /api/bills/[id]           — single bill

# Clerks
GET/POST /api/clerks          — list / create
PUT/DELETE /api/clerks/[id]
POST /api/clerks/auth         — validate PIN, returns clerk info

# Bill Config
GET/PUT /api/bill-config      — single-row shop/receipt settings
```

### POS Interaction Flow
1. Clerk logs in via PIN (required before any sale)
2. Optionally type quantity on numpad (or press QTY then type)
3. Click product button → added to cart with qty (default 1)
4. Click cart row to select/highlight; click again to deselect
5. VOID removes selected item (or last item if none selected)
6. TRANSACT VOID clears entire cart
7. DISCOUNT: enter amount on numpad first, then press DISCOUNT
8. CASH / BILL button: POSTs to `/api/bills`, opens PDF receipt in new tab, clears cart
