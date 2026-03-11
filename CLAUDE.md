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

## Architecture

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite + jsPDF

### Pages
| Route | Purpose |
|---|---|
| `/` | Main POS screen — the primary shopkeeper interface |
| `/admin/login` | Admin login (default: admin / admin123) |
| `/admin` | Admin portal — Products, Categories, Clerks, Bill Config, Settings tabs |
| `/bills` | Bill history with reprint support |

## Auth
- Sessions via httpOnly cookie `pos_session` (8h expiry, in-memory store)
- Default credentials: `admin` / `admin123` — change on first login via Settings tab
- `src/middleware.ts` redirects all `/admin/*` (except `/admin/login`) when unauthenticated
- `src/lib/auth.ts` — hashPassword (SHA-256 + secret), createSession, validateSession

### Key Files
- `src/app/page.tsx` — POS orchestrator: owns all state (cart, numpad, discount, mode)
- `src/components/BillPanel.tsx` — Left panel: scrollable cart + totals footer
- `src/components/ProductGrid.tsx` — Category tabs + color-coded 5-col product grid
- `src/components/Numpad.tsx` — Numpad (0-9, 00, .) + action buttons (VOID, QTY, BILL, etc.)
- `src/components/ActionBar.tsx` — Bottom bar: SUBTOTAL, DISCOUNT, CASH
- `src/lib/billUtils.ts` — `generateBillNumber()` + `printBillPDF()` (80mm thermal receipt)
- `src/lib/db.ts` — Prisma singleton safe for Next.js hot reload
- `prisma/schema.prisma` — Models: Category, Product, Bill, BillItem (SQLite)

### Database Models
```
Category → Product (one-to-many)
Bill → BillItem (one-to-many)
BillItem → Product (many-to-one)
```

### POS Interaction Flow
1. Optionally type quantity on numpad (or press QTY then type)
2. Click product button → added to cart with qty (default 1)
3. Click cart row to select/highlight; click again to deselect
4. VOID removes selected item (or last item if none selected)
5. TRANSACT VOID clears entire cart
6. DISCOUNT action bar button: enter amount on numpad first, then press DISCOUNT
7. CASH / BILL button: POSTs to `/api/bills`, opens PDF receipt in new tab, clears cart

### API Routes
- `GET/POST /api/categories` — categories with nested products
- `GET/POST /api/products` — all products
- `PUT/DELETE /api/products/[id]` — update/delete product
- `GET/POST /api/bills` — bill history / create bill
- `GET /api/bills/[id]` — single bill
