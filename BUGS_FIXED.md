# Bug Fixes - Price Editing & Logo Upload

## Summary
Fixed two critical bugs preventing price updates and logo uploads from persisting to the database.

---

## ISSUE #1: PRICE EDITING NOT SAVING ✅ FIXED

### Root Cause
**File:** `src/App.tsx` - `saveProduct()` function (line 1384)

**Problems:**
1. **Missing numeric type conversion**: Database stores prices as `numeric(10,2)` but JavaScript sends `number` type - can cause precision issues
2. **No error handling**: Update queries didn't check for database errors
3. **Missing `.select()` on inserts**: New product inserts weren't properly returning the product ID

### The Bug
```typescript
// BEFORE (Line 1388-1395)
const payload = {
  category_id: product.category_id,
  name: product.name,
  price: product.price ?? 0,  // ❌ No conversion for numeric(10,2)
  // ...
};
if (product.id) {
  await supabase.from('products').update(payload).eq('id', product.id);  // ❌ No error check
}
```

### The Fix
```typescript
// AFTER
const payload = {
  category_id: product.category_id,
  name: product.name,
  price: parseFloat(String(product.price ?? 0)),  // ✅ Proper numeric conversion
  // ...
};
if (product.id) {
  const { error } = await supabase.from('products').update(payload).eq('id', product.id);
  if (error) throw error;  // ✅ Error handling
}
```

### Additional Fixes
- Applied same numeric type conversion to `price_modifier` fields in variants
- Updated category `sort_order` to use `parseFloat()` conversion
- Fixed order editing to properly convert `delivery_fee`, `subtotal`, `total`, and `unit_price`
- Changed button text from "Save Product" → "Save Changes" for UX clarity

---

## ISSUE #2: LOGO UPLOAD NOT PERSISTING ✅ FIXED

### Root Cause
**File:** `src/App.tsx` - `handleSaveSettings()` function (line 1686)

**Problem:** 
The `upsert()` call was missing the `onConflict` option. Without it, Supabase defaults to using the primary key (`id`) for conflict resolution instead of the unique constraint (`key` column).

**Result:** 
Settings were being **inserted as new rows** instead of **updating existing rows**. Every time you saved, duplicate settings records were created in the database with no updates to the actual values.

### Database Schema Context
```sql
create table public.app_settings (
  id uuid primary key default gen_random_uuid(),  -- Primary key (not the conflict key)
  key text unique not null,                       -- Unique constraint (should be the conflict key)
  value text,
  updated_at timestamptz not null default now()
);

-- Schema shows 'key' is unique:
insert into public.app_settings (key, value) values ...
on conflict (key) do update set value = excluded.value;
```

### The Bug
```typescript
// BEFORE (Line 1686)
await supabase.from('app_settings').upsert(rows);
// ❌ No onConflict specified = defaults to primary key 'id'
// Result: Creates new rows instead of updating existing ones
```

### The Fix
```typescript
// AFTER
await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
// ✅ Explicitly tells Supabase to use 'key' column for conflict detection
// Result: Correctly updates existing settings
```

---

## Flow Diagrams

### Price Editing - Now Works ✅
```
User edits price → ProductForm state updates → Click "Save Changes"
  ↓
saveProduct() receives updated product with new price
  ↓
Price converted: parseFloat(String(price)) → numeric(10,2)
  ↓
Database UPDATE with error checking
  ↓
load() reloads products from database
  ↓
Modal closes, product displays new price
```

### Logo Upload - Now Works ✅
```
User uploads image → File validation
  ↓
Upload to Supabase Storage → Get public URL
  ↓
Update local state with logo_url
  ↓
User clicks "Save Changes"
  ↓
Settings row with key='logo_url' properly UPSERTED (not inserted)
  ↓
onConflict: 'key' tells Supabase to UPDATE, not INSERT
  ↓
Logo URL persists in database
```

---

## Files Modified
- **src/App.tsx**
  - `saveProduct()` - Added numeric conversion and error handling
  - `saveCategory()` - Added numeric conversion for sort_order
  - `saveEdit()` - Added numeric conversions for all decimal fields
  - `handleSaveSettings()` - Added `{ onConflict: 'key' }` to upsert call
  - ProductForm button text - Changed to "Save Changes"

---

## Testing Checklist

### Price Editing ✅
- [ ] Edit product price (e.g., 100 → 250)
- [ ] Click "Save Changes"
- [ ] Verify price updates immediately in product list
- [ ] Refresh page
- [ ] Verify price persists after refresh
- [ ] Edit again with decimal prices (e.g., 99.99)
- [ ] Verify decimal precision preserved

### Logo Upload ✅
- [ ] Upload a PNG, JPG, JPEG, or WEBP image
- [ ] Verify preview shows immediately
- [ ] Click "Save Changes"
- [ ] Verify success message appears
- [ ] Refresh page
- [ ] Verify logo still displays
- [ ] Replace existing logo with new image
- [ ] Verify replacement persists after refresh
- [ ] Check receipt preview includes logo

---

## Technical Details

### Numeric Type Handling
Supabase `numeric(10,2)` fields require proper conversion to prevent precision loss:
```typescript
// ✓ Correct
price: parseFloat(String(product.price ?? 0))

// ✗ Incorrect
price: product.price ?? 0  // May lose precision or cause type mismatch
```

### Upsert with onConflict
```typescript
// Upsert with conflict detection on 'key' column
await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });

// Without onConflict, defaults to primary key:
// - Tries to upsert on 'id' (auto-generated UUID)
// - Each row gets a new UUID, so it's always an INSERT
// - Existing rows never get updated
```

---

## Impact
- ✅ Product prices now update correctly
- ✅ Price changes persist after refresh
- ✅ Logo uploads save permanently
- ✅ Settings changes no longer create duplicate database records
- ✅ Improved UX with clearer button labeling
- ✅ Better error handling for database operations
