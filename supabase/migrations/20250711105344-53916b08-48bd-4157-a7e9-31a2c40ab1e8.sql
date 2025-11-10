-- Create marketing-assets bucket for public video access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marketing-assets', 'marketing-assets', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg']);

-- Create policies for public video access
CREATE POLICY "Public video access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'marketing-assets');

CREATE POLICY "Admin can upload marketing videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'marketing-assets' AND auth.uid() IS NOT NULL);