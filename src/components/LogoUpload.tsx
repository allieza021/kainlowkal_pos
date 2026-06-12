import { useState } from 'react';
import type { BusinessSettings } from '../types';
import { validateLogoFile, getLogoFileName } from '../lib/logoUtils';

interface LogoUploadProps {
  logo_url: string;
  onLogoChange: (url: string) => void;
  uploading: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  onMessage: (msg: string, type: 'success' | 'error') => void;
  supabase: any;
}

export function LogoUpload({
  logo_url,
  onLogoChange,
  uploading,
  message,
  messageType,
  onMessage,
  supabase
}: LogoUploadProps) {
  async function handleLogoUpload(file: File | null) {
    if (!file) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      onMessage(`✗ ${validation.error}`, 'error');
      return;
    }

    try {
      const fileName = getLogoFileName(file);
      const { data, error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;

      if (publicUrl) {
        onLogoChange(publicUrl);
        onMessage('✓ Logo uploaded successfully', 'success');
      }
    } catch (err) {
      onMessage(
        `✗ Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      );
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-gray-600">Logo</label>
      <div className="mt-2">
        {logo_url ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-gray-200 p-3">
            <img src={logo_url} alt="Logo" className="h-12 w-12 object-contain" />
            <div className="flex-1 text-xs text-gray-600">Logo uploaded</div>
            <button
              onClick={() => onLogoChange('')}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 transition hover:border-orange-500 hover:bg-orange-50">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
            disabled={uploading}
            className="hidden"
          />
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-700">{uploading ? 'Uploading...' : 'Click to upload logo'}</div>
            <div className="text-xs text-gray-500">PNG, JPG, or WEBP • Max 5MB</div>
          </div>
        </label>
      </div>
    </div>
  );
}
