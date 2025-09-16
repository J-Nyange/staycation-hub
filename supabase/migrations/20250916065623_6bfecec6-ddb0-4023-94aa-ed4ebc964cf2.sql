-- Update existing properties with multiple images and detailed descriptions
UPDATE properties 
SET 
  description = CASE 
    WHEN title LIKE '%Luxury Ocean%' THEN 'Experience unparalleled luxury in this stunning oceanfront villa featuring panoramic sea views, private infinity pool, and direct beach access. The spacious interior boasts high-end finishes, gourmet kitchen with top-of-the-line appliances, and elegant living spaces perfect for entertaining. Wake up to breathtaking sunrises from the master suite balcony and enjoy world-class amenities including concierge service, private chef options, and water sports equipment. This exclusive retreat offers the perfect blend of sophistication and relaxation for an unforgettable getaway.'
    WHEN title LIKE '%Cozy Mountain%' THEN 'Escape to this charming mountain cabin nestled among towering pines and scenic hiking trails. This rustic yet comfortable retreat features a stone fireplace, fully equipped kitchen, and wraparound deck with stunning valley views. Perfect for outdoor enthusiasts, the cabin provides easy access to hiking, fishing, and seasonal activities. The warm wooden interiors create a cozy atmosphere, while modern amenities ensure a comfortable stay. Gather around the fire pit under starlit skies and create lasting memories in this peaceful mountain sanctuary.'
    WHEN title LIKE '%Urban Loft%' THEN 'Immerse yourself in city living at this modern industrial loft located in the heart of downtown. Featuring exposed brick walls, soaring ceilings, and floor-to-ceiling windows that flood the space with natural light. The open-concept design seamlessly blends living, dining, and kitchen areas, creating perfect spaces for both relaxation and entertainment. Premium amenities include a fully equipped kitchen with stainless steel appliances, luxurious bathroom with rainfall shower, and private rooftop terrace with city skyline views. Walking distance to trendy restaurants, galleries, and nightlife.'
    ELSE 'Discover the perfect blend of comfort and style in this beautifully designed property. Thoughtfully curated with modern amenities and elegant touches, this accommodation offers everything needed for an exceptional stay. The spacious layout features comfortable living areas, well-appointed bedrooms, and a fully equipped kitchen. Guests can enjoy premium furnishings, high-speed internet, and carefully selected local artwork throughout. The property provides easy access to local attractions, dining, and entertainment venues, making it an ideal base for exploring the area and creating unforgettable memories.'
  END,
  images = CASE 
    WHEN category = 'villa' THEN ARRAY[
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'
    ]
    WHEN category = 'airbnb' THEN ARRAY[
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1551361415-69c87624334f?w=800',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'
    ]
    WHEN category = 'homestay' THEN ARRAY[
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    ]
  END,
  main_image = CASE 
    WHEN category = 'villa' THEN 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    WHEN category = 'airbnb' THEN 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    WHEN category = 'homestay' THEN 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
  END
WHERE images IS NULL OR array_length(images, 1) IS NULL OR array_length(images, 1) < 3;

-- Insert additional sample properties with multiple images and detailed descriptions
INSERT INTO properties (
  title, description, location, category, price_per_night, guests, bedrooms, bathrooms, 
  main_image, images, amenities, is_active
) VALUES 
(
  'Seaside Villa Paradise',
  'Indulge in luxury at this magnificent seaside villa boasting unobstructed ocean views and private beach access. This architectural masterpiece features an open-concept design with floor-to-ceiling glass walls that seamlessly blend indoor and outdoor living. The gourmet kitchen showcases premium appliances and a large island perfect for culinary adventures. The master suite includes a private terrace, walk-in closet, and spa-like bathroom with soaking tub overlooking the sea. Additional amenities include infinity pool, outdoor kitchen, fitness room, and private dock. Professional landscaping creates serene gardens and entertainment areas perfect for hosting memorable gatherings.',
  'Malibu, California',
  'villa',
  899.00,
  8,
  4,
  3,
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
  ],
  ARRAY['wifi', 'pool', 'beach_access', 'parking', 'kitchen', 'air_conditioning'],
  true
),
(
  'Mountain Lodge Retreat',
  'Escape to this stunning mountain lodge offering breathtaking alpine views and world-class outdoor adventures. Crafted with natural stone and timber, this rustic yet luxurious property features vaulted ceilings, a grand stone fireplace, and panoramic windows showcasing majestic mountain vistas. The gourmet kitchen includes professional-grade appliances and expansive dining areas perfect for group gatherings. Each bedroom offers comfort and mountain views, while the master suite features a private balcony and fireplace. Amenities include hot tub, game room, ski equipment storage, and multiple outdoor decks. Located minutes from hiking trails, skiing, and charming mountain villages.',
  'Aspen, Colorado',
  'villa',
  1299.00,
  12,
  6,
  4,
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800'
  ],
  ARRAY['wifi', 'parking', 'kitchen', 'air_conditioning', 'gym'],
  true
),
(
  'Tropical Island Bungalow',
  'Experience paradise at this enchanting tropical bungalow surrounded by lush gardens and steps from pristine white sand beaches. This eco-friendly retreat combines sustainable design with modern comfort, featuring natural materials, open-air living spaces, and seamless indoor-outdoor flow. The spacious living area opens to covered terraces perfect for morning coffee or sunset cocktails. The well-equipped kitchen includes local artwork and opens to herb gardens. Bedrooms feature ceiling fans, mosquito netting, and private outdoor showers. Enjoy complimentary bicycles, snorkeling gear, and kayaks. The property includes meditation spaces, tropical fruit trees, and direct beach access for ultimate relaxation.',
  'Tulum, Mexico',
  'homestay',
  189.00,
  4,
  2,
  2,
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
  ],
  ARRAY['wifi', 'beach_access', 'parking', 'kitchen'],
  true
),
(
  'Downtown Penthouse Luxury',
  'Live like royalty in this spectacular penthouse offering 360-degree city views from the heart of downtown. This ultra-modern residence features floor-to-ceiling windows, premium finishes, and an open layout perfect for entertaining. The gourmet kitchen boasts top-of-the-line appliances, waterfall quartz countertops, and a wine refrigerator. The master suite includes a walk-in closet and spa bathroom with city views. The crown jewel is the private rooftop terrace with outdoor kitchen, fire pit, and panoramic skyline views. Building amenities include 24-hour concierge, fitness center, pool, and valet parking. Walking distance to theaters, restaurants, and cultural attractions.',
  'Chicago, Illinois',
  'airbnb',
  459.00,
  6,
  3,
  2,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1551361415-69c87624334f?w=800',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'
  ],
  ARRAY['wifi', 'parking', 'kitchen', 'air_conditioning', 'gym'],
  true
);