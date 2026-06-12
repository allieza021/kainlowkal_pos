# Logo Upload Feature - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Supabase Setup (Required)
```bash
# Check if 'logos' bucket exists in your Supabase dashboard:
# Dashboard → Storage → Check for 'logos' bucket
# If missing, create it:
# - Click "Create a new bucket"
# - Name: logos
# - Public bucket: ✓ Enable
# - Click Create
```

### Step 2: Run Your POS App
```bash
npm run dev
```

### Step 3: Test Logo Upload
1. Navigate to **Settings** page
2. Click **"Click to upload logo"** area
3. Select any PNG, JPG, or WEBP image (or test image below)
4. Watch the upload complete
5. See logo preview appear

### Step 4: Create an Order
1. Go to **Menu** page
2. Add items to cart
3. Proceed to checkout
4. Complete the order

### Step 5: Print Receipt
1. Click **"Print Receipt"** button
2. New window opens showing receipt with your logo
3. Logo appears at the top
4. Business name is hidden (since logo contains it)

### Step 6: Verify Persistence
1. **Refresh** the page (F5)
2. Go back to **Settings**
3. ✅ Logo still there!
4. Create another order and print
5. ✅ Logo still appears on receipt!

## 📁 What Was Added

### New Files
```
src/
├── lib/logoUtils.ts              # Logo utilities & validation
└── components/LogoUpload.tsx     # Reusable upload component

Documentation files:
├── LOGO_SETUP.md                 # Complete feature guide
├── SUPABASE_LOGO_SETUP.md        # Supabase configuration
└── IMPLEMENTATION_SUMMARY.md     # Technical summary
```

### Files Modified
```
src/
├── App.tsx                       # Enhanced logo upload UI & validation
└── components/Receipt.tsx        # Optimized logo display on receipts
```

## 🎯 Key Features

✅ **Upload**: PNG, JPG, WEBP (max 5MB)
✅ **Display**: Logo on thermal receipts, printed receipts, order slips
✅ **Smart**: Hides business name when logo present
✅ **Persistent**: Survives refresh and restart
✅ **Easy**: One-click upload, one-click remove
✅ **Validated**: File type and size checking
✅ **Optimized**: Perfect for 58mm thermal paper

## 🧪 Testing Checklist

- [ ] Logo uploads without errors
- [ ] Logo appears on new order receipt
- [ ] Business name hidden on receipt
- [ ] Page refresh shows logo still there
- [ ] Remove button deletes logo
- [ ] New logo replaces old one
- [ ] Error shows for wrong file type
- [ ] Error shows for file > 5MB

## 📱 Receipt Layout Examples

### With Logo
```
┌─────────────────────────┐
│                         │
│     [LOGO IMAGE]        │  ← Your logo here
│                         │
└─────────────────────────┘
Order #: 1001
Date: 2026-06-12
...
```

### Without Logo (fallback)
```
┌─────────────────────────┐
│     KAINLOWKAL          │
│      SINCE 2019         │
└─────────────────────────┘
Order #: 1001
Date: 2026-06-12
...
```

## 🔧 Implementation Details

### Upload Flow
File → Validation → Supabase Storage → Public URL → Database

### Receipt Flow
Order + Settings → Check Logo → Display Logo OR Name → Print

### Data Storage
```
Supabase app_settings table:
┌──────────────────────────────┐
│ key: 'logo_url'              │
│ value: 'https://...'         │
└──────────────────────────────┘
```

## 📝 Code Examples

### Use Logo Upload Component
```tsx
import { LogoUpload } from './components/LogoUpload';

<LogoUpload
  logo_url={settings.logo_url}
  onLogoChange={(url) => setSettings({ ...settings, logo_url: url })}
  uploading={uploading}
  message={message}
  messageType={messageType}
  onMessage={setMessage}
  supabase={supabase}
/>
```

### Validate Logo File
```tsx
import { validateLogoFile } from './lib/logoUtils';

const validation = validateLogoFile(file);
if (!validation.valid) {
  console.log(validation.error); // "File size must be under 5MB"
}
```

### Build Receipt with Logo
```tsx
import { buildReceiptHtml } from './components/Receipt';

const html = buildReceiptHtml({
  ...order,
  logo_url: 'https://...',
  business_name: 'KAINLOWKAL'
});
```

## ⚠️ Troubleshooting

### Logo not showing on receipt
- ✓ Logo uploaded? (check settings preview)
- ✓ File accessible? (open URL in browser)
- ✓ Supabase bucket public? (check Storage settings)

### Upload fails
- ✓ File format correct? (PNG, JPG, WEBP only)
- ✓ File size OK? (max 5MB)
- ✓ Internet working? (check connection)

### Logo disappears after refresh
- ✓ Did upload complete? (check success message)
- ✓ Database saved? (check Supabase app_settings)
- ✓ Browser cache? (try hard refresh Ctrl+Shift+R)

## 🎓 Learning Resources

### Files to Read in Order
1. `IMPLEMENTATION_SUMMARY.md` - Overview
2. `src/lib/logoUtils.ts` - Validation logic
3. `src/components/Receipt.tsx` - Receipt generation
4. `SUPABASE_LOGO_SETUP.md` - Database setup

### Key Concepts
- **Supabase Storage**: File upload service
- **Public URLs**: Accessible without auth
- **Auto-save**: 2-second debounce on settings
- **Thermal printing**: 58mm width optimization

## 🎨 Customization Ideas

Want to customize the feature? Try:
1. Change max file size: `LOGO_CONFIG.maxSizeBytes`
2. Change logo dimensions: `.logo-container img` CSS
3. Add logo to invoice footer: Modify `buildReceiptHtml()`
4. Change upload UI colors: Tailwind classes in settings

## 📞 Support

### Common Questions

**Q: Can I have multiple logos?**
A: Current implementation supports 1 logo. Easy to extend!

**Q: What if Supabase bucket doesn't exist?**
A: Create it manually (see SUPABASE_LOGO_SETUP.md)

**Q: Can I upload SVG?**
A: Current implementation supports PNG, JPG, WEBP only

**Q: How big can the logo be?**
A: Max 5MB file size, displayed at max 50×30mm on receipt

**Q: Does logo print on all receipt types?**
A: Yes! Thermal receipts, printed receipts, and order slips

## ✨ Features Included

✅ File upload with drag-drop
✅ File type validation
✅ File size validation  
✅ Upload progress feedback
✅ Logo preview in settings
✅ Remove logo button
✅ Auto-save to database
✅ Conditional display logic
✅ Thermal print optimization
✅ Error messages
✅ Reusable components
✅ Full documentation

## 🚢 Ready to Ship!

Your logo feature is complete and production-ready. Just:
1. Verify Supabase bucket exists
2. Test upload in Settings
3. Print a receipt to verify
4. You're done! 🎉

For detailed information, see `LOGO_SETUP.md`
