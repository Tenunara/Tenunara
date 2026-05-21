# Fitur Keranjang Belanja Pengrajin

**Tanggal:** 2026-05-22
**Status:** Approved
**Scope:** Fitur keranjang server-side untuk pengrajin (buyer) dengan checkout sederhana

## Konteks

Tombol "Keranjang" di halaman detail produk saat ini langsung membuat order — tidak ada penyimpanan keranjang. Pengrajin tidak bisa mengumpulkan beberapa produk lalu checkout sekaligus.

## Keputusan Desain

1. **Campur UMKM** — keranjang boleh berisi produk dari banyak UMKM. Checkout otomatis pecah menjadi 1 order per UMKM.
2. **Server-side** — data keranjang disimpan di database (bukan localStorage).
3. **Checkout sederhana** — klik checkout langsung buat order (pending_payment). User bayar per-order di halaman order detail seperti flow existing.

## Database

### Tabel `carts`

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengrajin_id UUID NOT NULL UNIQUE REFERENCES pengrajin(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabel `cart_items`

```sql
CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(7,2) NOT NULL CHECK (quantity_kg > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_carts
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_cart_items
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Constraint:** `UNIQUE(cart_id, product_id)` menjamin 1 baris per produk. Tambah produk yang sudah ada → update quantity (upsert).

### RLS Policies

- `carts`: pengrajin CRUD miliknya sendiri
- `cart_items`: pengrajin akses via cart miliknya

### Indexes

- `idx_carts_pengrajin_id` ON carts(pengrajin_id)
- `idx_cart_items_cart_id` ON cart_items(cart_id)
- `idx_cart_items_product_id` ON cart_items(product_id)

## Backend API

### `GET /api/cart`

Ambil keranjang dengan items + detail produk + grouping per UMKM.

Response:
```json
{
  "data": {
    "id": "cart-uuid",
    "items_count": 3,
    "groups": [
      {
        "umkm_id": "uuid",
        "umkm_name": "Konveksi Jaya",
        "items": [
          {
            "id": 1,
            "product_id": "uuid",
            "quantity_kg": 5,
            "product": {
              "images_url": ["..."],
              "fabric_name": "Denim",
              "final_grade": "A",
              "price_per_kg": 15000,
              "total_weight_kg": 50,
              "minimum_order_kg": 2
            }
          }
        ],
        "subtotal": 75000
      }
    ],
    "grand_total": 75000
  }
}
```

Auto-create cart jika belum ada.

### `POST /api/cart/items`

Tambah item. Jika produk sudah ada di keranjang → tambah quantity (upsert).

Body: `{ "product_id": "uuid", "quantity_kg": 5 }`

Validasi:
- Role = pengrajin
- Product exists & status = published
- quantity_kg <= available stock
- quantity_kg >= minimum_order_kg (jika ada)
- Tidak memesan produk sendiri (pengrajin_id !== umkm_id product)

### `PATCH /api/cart/items/[id]`

Update quantity. Jika quantity_kg = 0 → hapus item.

Body: `{ "quantity_kg": 10 }`

### `DELETE /api/cart/items/[id]`

Hapus item dari keranjang.

### `POST /api/cart/checkout`

Konversi semua item keranjang menjadi order.

Alur:
1. Validasi semua item (stock, min order, published)
2. Kelompokkan items per UMKM
3. Buat 1 order per UMKM (status pending_payment, shipping_cost & app_fee dihitung)
4. Insert order_items + stock_reservations per order
5. Kosongkan cart (delete all cart_items)
6. Return array order IDs

Response: `{ "data": { "orders": [{ "order_id": "uuid", "order_number": "ORD-...", "umkm_name": "...", "grand_total": 75000 }], "count": 2 } }`

Jika ada item yang gagal validasi → return error dengan detail item mana yang bermasalah, jangan buat order sama sekali (atomic).

## Frontend

### File Structure

```
src/
├── components/cart/
│   ├── cart-sheet.tsx        # Slide-out cart panel
│   ├── cart-item-row.tsx     # Single cart item row
│   └── umkm-cart-group.tsx   # Items grouped by UMKM
├── contexts/
│   └── cart-context.tsx       # CartProvider + useCart hook
```

### Cart Context (`CartProvider`)

React Context yang membungkus dashboard layout.

Provided:
- `items` — flat list cart items
- `groupedItems` — items dikelompokkan per UMKM (dengan subtotal per group)
- `itemsCount` — total jumlah item (badge di navbar)
- `grandTotal` — total harga semua item
- `isLoading` — loading state
- `error` — error state
- `addItem(productId, quantityKg)` — tambah item (returns promise, throws on error)
- `updateItem(itemId, quantityKg)` — update qty
- `removeItem(itemId)` — hapus item
- `checkout()` — checkout → return order data → redirect ke /dashboard/orders
- `refreshCart()` — re-fetch dari server

Cart auto-load saat CartProvider mount (jika user role = pengrajin).

### Cart Sheet

Slide-out panel menggunakan komponen Sheet yang sudah ada.

States:
| State | Tampilan |
|-------|----------|
| Loading | Skeleton items |
| Empty | Ilustrasi + "Keranjang kosong" + tombol "Cari Produk" → `/dashboard/browse` |
| Has items | Item list per-UMKM group, qty stepper per item, hapus per item, subtotal per UMKM, grand total, tombol "Checkout" |
| Error | Pesan error + tombol retry |

Footer: grand total + tombol "Checkout" (disabled jika ada item yang stock-nya habis atau di bawah min order).

### Navbar Update

- Tambah ikon `ShoppingCart` di kanan, sebelum avatar (hanya untuk role pengrajin)
- Badge angka jumlah item
- Klik → buka CartSheet

### Product Detail Page Update

Ubah `handleAddToCart` di `/dashboard/listings/[id]/page.tsx`:
- Panggil `addItem(product.id, quantity)` dari cart context
- Success → toast "Ditambahkan ke keranjang" + ubah tombol jadi centang sesaat
- Error → alert error message
- Tombol "Beli Langsung" tetap langsung create order (tidak berubah)

### API Client (`src/lib/api.ts`)

Tambah fungsi:
- `fetchCart()` → GET /api/cart
- `addCartItem(productId, quantityKg)` → POST /api/cart/items
- `updateCartItem(itemId, quantityKg)` → PATCH /api/cart/items/[id]
- `removeCartItem(itemId)` → DELETE /api/cart/items/[id]
- `checkoutCart()` → POST /api/cart/checkout

### Layout Integration

```
(dashboard)/layout.tsx
  └── CartProvider
       ├── Navbar (with cart icon + CartSheet trigger)
       ├── Sidebar
       └── {children}
```

### Middleware Update

Route `/dashboard/cart` tidak perlu — cart diakses via Sheet. Tidak ada perubahan middleware.

## Edge Cases

1. **Tambah produk yang sudah ada** → quantity ditambah (bukan duplikat baris)
2. **Stock habis saat add** → error "Stok tidak mencukupi"
3. **Stock berkurang saat di cart** → saat GET cart tampilkan available stock, saat checkout validasi ulang
4. **Produk dihapus/diarsipkan UMKM** → tampilkan badge "Tidak tersedia" di cart, exclude dari checkout
5. **Produk dari UMKM yang sama dimasukkan 2x** → merge jadi 1 baris dengan qty gabungan
6. **Min order tidak terpenuhi** → warning di cart item, disable checkout untuk item tsb
7. **Checkout gagal sebagian** → atomic: semua berhasil atau semua gagal, cart tetap utuh jika gagal
8. **Cart kosong saat checkout** → error "Keranjang kosong"
9. **User bukan pengrajin** → semua API return 403

## Out of Scope

- Merge cart antar device (tidak ada conflict resolution)
- Simpan shipping/payment preference di cart
- Cart sharing
- Wishlist / save for later
- Notifikasi stock available untuk item di cart
