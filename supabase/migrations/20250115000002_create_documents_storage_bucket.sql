-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents'
);

-- Create policy to allow users to delete their own documents
CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);
