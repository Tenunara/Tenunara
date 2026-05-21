# TENUNARA — Project TODO

## Auth & Session (Frontend ✅ — Backend by Rizky)

| Status | Feature | Notes |
|--------|---------|-------|
| ✅ | Login (`POST /api/auth/login`) | Demo buttons: UMKM / Pengrajin |
| ✅ | Register (`POST /api/auth/register/*`) | Role-based form (UMKM / Pengrajin) |
| ✅ | Session check (`GET /api/auth/me`) | Dashboard layout + middleware verify |
| ✅ | Profile photo upload (`POST /api/auth/upload-profile-photo`) | — |
| ✅ | Role-based route protection | Middleware blocks cross-role access |

## Mock → Real API (waiting for BE endpoints)

| Module | Route | Current | BE Endpoint Needed |
|--------|-------|---------|--------------------|
| My Listings | `/dashboard/listings` | `temp_data_listings.json` | `GET /api/listings?seller_id=` |
| Listing Detail | `/dashboard/listings/[id]` | `temp_data_listing_detail.json` | `GET /api/listings/[id]` |
| Create Listing | `/dashboard/listings/new` | Mock `submitListing()` | `POST /api/listings` |
| Browse / Search | `/dashboard/browse`, `/dashboard/search` | `temp_data_listings.json` | `GET /api/listings/search?q=` |
| AI Image Analysis | `ImageUploader` component | Mock 1.5s delay | AI vision API endpoint |
| Listing photos | `listing-card.tsx`, detail page | `/dummy1.png` placeholder | Profile/listing photo upload |

## Unimplemented Modules (FE needs building)

| Module | Route | Sidebar Label | Mock Data Ready? |
|--------|-------|---------------|------------------|
| Orders | `/dashboard/orders` + `[id]` | "Pesanan Masuk" / "Pesanan Saya" | ✅ `temp_data_transactions.json` |
| Disputes | `/dashboard/disputes` | "Sengketa" | ✅ `temp_data_disputes.json` |
| ESG Dashboard | `/dashboard/esg` | "ESG" | ✅ `temp_data_esg.json` |

## UI Polish (low priority / final step)

| Item | Location | Notes |
|------|----------|-------|
| Brand logo | `navbar.tsx`, auth layout | Replace `◈` placeholder |
| Avatar image | `navbar.tsx` | Show uploaded `foto_profil_url` instead of initials |
| shadcn Dialog | `confirm-dialog.tsx` | Replace custom overlay with `@/components/ui/dialog` |
| Metadata | `layout.tsx` | Update when brand assets finalized |
| Error/Empty state buttons | shared components | Use proper `Button` component |
