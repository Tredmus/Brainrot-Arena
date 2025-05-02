import React, { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  defaultImage?: string;
  bucket?: 'avatars' | 'character-images';
}

export default function ImageUpload({ onUpload, defaultImage, bucket = 'avatars' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Create object URL for preview
      setPreview(URL.createObjectURL(file));

      // Upload image to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error uploading image');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Change Image
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <div className="text-center">
            <p className="text-gray-400">Click to upload image</p>
            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={uploadImage}
            disabled={uploading}
          />
        </label>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-purple-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
          Uploading...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!uploading && !error && preview && (
        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-lg">
          <Check className="w-5 h-5" />
          <span>Image uploaded successfully!</span>
        </div>
      )}
    </div>
  );
}