-- Create reports storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Create RLS policies for reports bucket
CREATE POLICY "Users can upload their own reports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND is_admin(auth.uid()));

-- Service role can manage all files (for background job generation)
CREATE POLICY "Service role can manage all reports" 
ON storage.objects FOR ALL 
USING (bucket_id = 'reports');