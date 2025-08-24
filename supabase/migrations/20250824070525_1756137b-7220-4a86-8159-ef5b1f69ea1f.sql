-- Create storage buckets for profile photos and shop images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-photos', 'profile-photos', true),
  ('shop-images', 'shop-images', true);

-- Create storage policies for profile photos
CREATE POLICY "Users can upload their own profile photo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile photo" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for shop images
CREATE POLICY "Shop owners can upload their shop image" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view shop images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'shop-images');

CREATE POLICY "Shop owners can update their shop image" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Shop owners can delete their shop image" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'shop-images' AND auth.uid()::text = (storage.foldername(name))[1]);