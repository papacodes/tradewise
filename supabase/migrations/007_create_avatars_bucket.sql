-- Storage bucket setup for avatars
-- Note: The 'avatars' bucket must be created manually in the Supabase Dashboard
-- with the following settings:
-- - Name: avatars
-- - Public: true
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- The profiles table already exists with avatar_url column
-- Just ensure proper permissions are set

-- Grant permissions to anon and authenticated roles for profiles table
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;

-- Create storage policies for avatars bucket (will be applied after bucket creation)
-- These policies will be created automatically when the bucket is set up

-- Policy: Users can upload their own avatars
-- CREATE POLICY "Users can upload own avatar" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can update their own avatars  
-- CREATE POLICY "Users can update own avatar" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own avatars
-- CREATE POLICY "Users can delete own avatar" ON storage.objects
--   FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Anyone can view avatars (public read)
-- CREATE POLICY "Anyone can view avatars" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');