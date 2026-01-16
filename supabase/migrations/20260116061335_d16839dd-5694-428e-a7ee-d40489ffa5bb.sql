-- Allow owners to create conversations for their properties
CREATE POLICY "Owners can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'sub') = owner_id 
    AND EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_id 
      AND properties.owner_id = (auth.jwt() ->> 'sub')
    )
  );