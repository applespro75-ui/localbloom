import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucket: 'profile-photos' | 'shop-images';
  currentImageUrl?: string;
  onImageUpload: (url: string) => void;
  label: string;
  description: string;
}

export function ImageUpload({ bucket, currentImageUrl, onImageUpload, label, description }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onImageUpload(data.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      
      {currentImageUrl && (
        <div className="w-32 h-32 rounded-lg border overflow-hidden">
          <img 
            src={currentImageUrl} 
            alt="Current image" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </div>
    </div>
  );
}