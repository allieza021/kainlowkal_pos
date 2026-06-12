# Supabase Setup for Logo Storage

## Prerequisites
- Supabase project already created
- Authenticated access to your Supabase dashboard

## Step 1: Create Storage Bucket

1. Log in to your Supabase dashboard
2. Navigate to **Storage** from the left sidebar
3. Click **Create a new bucket**
4. Configure:
   - **Name**: `logos`
   - **Public bucket**: ✓ Enable (checked)
   - Click **Create bucket**

## Step 2: Set Storage Policies

Once the bucket is created, set public access policies:

### Option A: Basic Public Access (Development)
In Supabase SQL Editor, run:
```sql
-- Allow anyone to read logos (public)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own logos" ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos')
WITH CHECK (auth.role() = 'authenticated');
```

### Option B: Admin-Only Upload (Recommended for Production)
```sql
-- Public read access
CREATE POLICY "Public can read logos" ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Admin-only uploads
CREATE POLICY "Admin users can upload logos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (auth.jwt() ->> 'user_role' = 'admin' OR 
       auth.uid() IN (SELECT id FROM staff_profiles WHERE role = 'admin'))
);
```

## Step 3: Verify Configuration

Test the setup:

1. **Upload a test image** via the Settings page in your POS system
2. **Check the bucket** in Supabase Storage - you should see `logos/{timestamp}.{ext}`
3. **Verify public URL** - Click file, copy public URL, open in browser
4. **Test on receipt** - Print a receipt to verify logo appears

## Troubleshooting

### Upload fails with 403 error
- Bucket not set to public
- Policies not created
- User not authenticated
- Run: `SELECT auth.role();` in Supabase to check current role

### Logo URL returns 404
- Bucket name is incorrect (should be lowercase `logos`)
- File path is wrong
- Storage region mismatch

### CORS errors in console
- Check bucket public access is enabled
- Verify CORS policy if using custom domain

## File Structure in Bucket

After uploads, your bucket will look like:
```
logos/
  ├── 1718208480123.png
  ├── 1718208512456.jpg
  └── 1718208545789.webp
```

Each file has a unique timestamp-based name to prevent collisions.

## Getting Public URL

Public URLs follow this format:
```
https://{PROJECT_ID}.supabase.co/storage/v1/object/public/logos/{timestamp}.{ext}
```

Example:
```
https://abc123xyz.supabase.co/storage/v1/object/public/logos/1718208480123.png
```

## Storage Costs

- **Free tier**: 1GB total storage
- **Logo images**: Typically 100KB-500KB each
- **Recommendations**:
  - Compress images before upload
  - Delete old logos if space is needed
  - Upgrade plan if storage exceeds 1GB

## Backup & Cleanup

### View all logos
```sql
SELECT * FROM storage.objects
WHERE bucket_id = 'logos'
ORDER BY created_at DESC;
```

### Manual cleanup (old logos)
```sql
DELETE FROM storage.objects
WHERE bucket_id = 'logos'
AND created_at < NOW() - INTERVAL '30 days';
```

## Environment Variables

Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These are used by `src/lib/supabase.ts` to initialize the client.

## Next Steps

1. Create the `logos` bucket
2. Run the SQL policies
3. Test upload via Settings page
4. Print a receipt to verify logo displays
5. Check the troubleshooting guide if issues occur

## Support

If you encounter issues:
1. Check Supabase dashboard for bucket status
2. Review browser console for errors
3. Check Network tab to see API responses
4. Verify file permissions in Supabase dashboard
