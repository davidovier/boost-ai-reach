-- Add DELETE policy for scans table
CREATE POLICY "Users can delete scans of their sites"
ON scans
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM sites 
  WHERE sites.id = scans.site_id 
  AND sites.user_id = auth.uid()
));