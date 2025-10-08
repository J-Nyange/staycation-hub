-- Phase 1 & 2: Add sample reviews and fix property ownership

-- First, assign the existing user as owner of all properties
UPDATE properties 
SET owner_id = '32e08686-e22b-4947-8615-d2c76caa053f'
WHERE owner_id IS NULL;

-- Insert sample reviews for properties
-- Reviews for Luxury Beachfront Villa
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('a9edb529-11c4-48fc-b05a-2243a9bba441', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Absolutely stunning property! The ocean views were breathtaking and the host was very accommodating. Would definitely stay again.'),
('a9edb529-11c4-48fc-b05a-2243a9bba441', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Beautiful villa with amazing amenities. The beach access was perfect for morning walks. Only minor issue was wifi speed.'),
('a9edb529-11c4-48fc-b05a-2243a9bba441', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Perfect getaway! The villa exceeded all expectations. Clean, modern, and the infinity pool was incredible.');

-- Reviews for Oceanview Villa Paradise
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('e56d72b7-faac-4d1d-81ce-701a4faff313', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'One of the best vacation rentals we have stayed at. The sunset views from the terrace were magical.'),
('e56d72b7-faac-4d1d-81ce-701a4faff313', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Great location and very spacious. Perfect for families. The kitchen was well-equipped.');

-- Reviews for Cozy Kilifi Homestay
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('06f66056-ce11-4236-8198-9b6e2b508349', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Such a warm and welcoming place! The hosts made us feel like family. Highly recommend for an authentic experience.'),
('06f66056-ce11-4236-8198-9b6e2b508349', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Cozy and comfortable homestay. Great value for money and the breakfast was delicious.'),
('06f66056-ce11-4236-8198-9b6e2b508349', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Loved every moment! The location is peaceful and the hospitality was outstanding.');

-- Reviews for Executive Vipingo Villa
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('1e0b6104-49ab-442b-92dc-ae5afae78c5d', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Luxury at its finest! The villa is immaculate and the staff was professional. Perfect for a special occasion.'),
('1e0b6104-49ab-442b-92dc-ae5afae78c5d', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Very impressive property with top-notch amenities. The private pool was a highlight.');

-- Reviews for Beachside Retreat
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('3185e66d-dddf-498c-aa8d-424b6ee82a3d', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Lovely retreat right on the beach. Waking up to the sound of waves was heavenly.'),
('3185e66d-dddf-498c-aa8d-424b6ee82a3d', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Perfect beach house! Everything was clean and well-maintained. The outdoor shower was a nice touch.'),
('3185e66d-dddf-498c-aa8d-424b6ee82a3d', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Great location and beautiful sunsets. Would stay here again without hesitation.');

-- Reviews for Modern Kilifi Apartment
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('2c33922b-3325-4836-8454-6aacc964a4f7', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Modern and stylish apartment in a great location. Very convenient for exploring the area.'),
('2c33922b-3325-4836-8454-6aacc964a4f7', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'Spotlessly clean with all the modern amenities you could need. Excellent value.');

-- Reviews for Luxury Ocean View Condo
INSERT INTO reviews (property_id, user_id, rating, comment) VALUES
('ad4a9b0e-a8e7-4bfc-acf1-0d7b78424a83', '32e08686-e22b-4947-8615-d2c76caa053f', 5, 'The ocean views alone are worth it! Beautiful condo with high-end finishes throughout.'),
('ad4a9b0e-a8e7-4bfc-acf1-0d7b78424a83', '32e08686-e22b-4947-8615-d2c76caa053f', 4, 'Wonderful stay with stunning views. The building amenities were excellent too.');