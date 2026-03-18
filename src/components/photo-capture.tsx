'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Image } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoCaptureProps {
  entityType: 'corrective_action' | 'temperature_log';
  entityId?: string;
  onPhotoUploaded?: (url: string) => void;
  className?: string;
}

export function PhotoCapture({ entityType, entityId, onPhotoUploaded, className }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !entityId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedUrl(data.url);
        onPhotoUploaded?.(data.url);
        toast.success('Photo uploaded');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Captured photo"
            className="w-full max-h-48 object-cover rounded-lg border"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!uploadedUrl && entityId && (
            <Button
              size="sm"
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-1 h-4 w-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          )}
          {uploadedUrl && (
            <p className="text-xs text-emerald-600 mt-1 text-center">Photo uploaded</p>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-20 border-dashed"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Take Photo (optional)</span>
          </div>
        </Button>
      )}
    </div>
  );
}
