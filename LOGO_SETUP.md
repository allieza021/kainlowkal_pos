# Logo Upload Implementation Guide

## Overview
The POS system now supports business logo uploads with automatic display on all receipt types (thermal receipts, printed receipts, and order slips). The logo replaces the traditional business name header when present.

## Features

### 1. **Logo Upload Management**
- **Admin-only access**: Upload via Settings page
- **Supported formats**: PNG, JPG, WEBP
- **File size limit**: 5MB maximum
- **Storage**: Supabase Storage (`logos` bucket)
- **Persistence**: Saved to database and maintains after page refresh/restart

### 2. **Receipt Display**
- Logo automatically appears at the top of all receipts
- When logo is present:
  - Logo displays at optimal size for thermal printing
  - Business name and tagline are **hidden** (since logo contains them)
- When logo is absent:
  - Business name and tagline display as usual
  - Ensures professional appearance in both scenarios

### 3. **User Experience**
- **Easy upload**: Drag-drop or click to upload
- **Replace anytime**: Upload new logo to replace existing one
- **Remove option**: Delete logo via "Remove" button
- **Visual feedback**: Upload status messages and preview
- **Auto-save**: Settings auto-save with 2-second debounce

## File Structure

### Core Files Modified

#### `src/App.tsx`
- `uploadLogo()` - Handles file upload with validation
- Settings form with improved logo upload UI
- Auto-save integration

#### `src/components/Receipt.tsx`
- Enhanced `buildReceiptHtml()` with conditional logo/business name display
- Optimized styling for thermal receipt printing
- Logo sizing constraints for 58mm thermal paper

### New Files Created

#### `src/lib/logoUtils.ts`
Utility functions for logo management:
- `validateLogoFile()` - Validates file type and size
- `getLogoFileName()` - Generates consistent file names
- `LOGO_CONFIG` - Configuration constants

#### `src/components/LogoUpload.tsx`
Reusable component for logo uploads with:
- File validation
- Upload handling
- Preview display
- Remove functionality

## Database Schema

The logo URL is stored in the `app_settings` table:
```sql
{
  key: 'logo_url',
  value: 'https://...' -- Supabase public URL
}
```

## Receipt HTML Output

### With Logo
```html
<div class="logo-container">
  <img src="https://..." alt="Logo" />
</div>
<!-- Business name and tagline are hidden -->
```

### Without Logo
```html
<div class="header-text">KAINLOWKAL</div>
<div class="tagline">SINCE 2019</div>
```

## Thermal Receipt Optimization

The receipt is optimized for 58mm thermal paper:
- Page width: 58mm
- Logo maximum dimensions: 50mm width × 30mm height
- Responsive sizing for various image dimensions
- Dashed separator line preserved

## Supabase Storage Setup

**Required bucket**: `logos`

To create the bucket in Supabase:
1. Go to Storage in your Supabase dashboard
2. Create new bucket named `logos`
3. Set public access policy
4. Enable for authenticated users

### Storage Policy (Example)
```sql
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');
```

## Usage Example

### Upload Logo in Settings
1. Navigate to Settings page
2. Click on "Click to upload logo" area
3. Select PNG, JPG, or WEBP image (max 5MB)
4. Logo auto-saves to database
5. Appears on all receipts immediately

### Remove Logo
1. Click the "Remove" button in logo preview
2. Settings auto-save
3. Business name displays on receipts again

### In Order Management
When printing receipts, the logo automatically appears with no additional code needed:
```javascript
printReceipt({ ...order, ...settings });
```

## Validation Rules

### File Type Validation
- ✅ PNG (`image/png`)
- ✅ JPG/JPEG (`image/jpeg`)
- ✅ WEBP (`image/webp`)
- ❌ GIF, BMP, SVG, or other formats

### File Size Validation
- Maximum: 5MB
- Recommended: 500KB or less for faster loading

### Display Rules
- Maintains aspect ratio
- Maximum width: 50mm (for 58mm thermal paper)
- Maximum height: 30mm

## Error Handling

### Upload Failures
- File type not supported → Shows format error
- File too large → Shows size error
- Upload error → Shows Supabase error message
- All errors auto-clear after 3 seconds

### Edge Cases
- Empty file → Silently ignored
- Network failure → Shows error message
- Supabase bucket missing → Shows upload error
- Logo URL invalid → Falls back to business name

## Testing Checklist

- [ ] Upload PNG logo - appears on receipt
- [ ] Upload JPG logo - appears on receipt
- [ ] Upload WEBP logo - appears on receipt
- [ ] File too large - shows error
- [ ] Wrong file type - shows error
- [ ] Remove logo - business name displays
- [ ] Replace logo - new logo appears
- [ ] Thermal receipt preview - logo optimized for width
- [ ] Page refresh - logo persists
- [ ] Printed receipt - logo prints correctly
- [ ] Order slip - logo displays

## Performance Considerations

- Logo URLs are cached in settings state
- Auto-save debounce prevents excessive database writes
- Supabase CDN caches logo images
- Image sizes optimized for thermal receipt dimensions

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (88+)
- Firefox (87+)
- Safari (14+)
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Troubleshooting

### Logo not appearing on receipt
1. Check if `logo_url` is not empty in settings
2. Verify image URL is accessible
3. Check browser console for CORS errors
4. Ensure Supabase storage is public

### Upload fails
1. Check file size (max 5MB)
2. Verify file format (PNG, JPG, WEBP only)
3. Check internet connection
4. Verify Supabase bucket exists and is public

### Logo not persisting after refresh
1. Verify settings auto-saved (check message)
2. Check database for logo_url value
3. Verify Supabase connection
4. Check browser storage/cache

## Future Enhancements

- Logo cropping/editing before upload
- Multiple logo support (e.g., header + footer)
- Logo on packing slips
- QR code generation with logo
- Logo optimization/compression
