-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  category TEXT NOT NULL CHECK (category IN ('airbnb', 'villa', 'homestay')),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  main_image TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  stripe_session_id TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id, booking_id)
);

-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Property owners can manage their properties" ON public.properties
  FOR ALL USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Wishlists policies
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can manage their own blog posts" ON public.blog_posts
  FOR ALL USING (auth.uid() = author_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  return NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample properties data
INSERT INTO public.properties (title, description, location, price_per_night, guests, category, amenities, main_image) VALUES
('Executive Vipingo Villa', 'Luxury beachfront villa with private pool and stunning ocean views', 'Vipingo, Kilifi', 180, 6, 'villa', ARRAY['wifi', 'parking', 'pool', 'kitchen'], '/src/assets/hero-villa.jpg'),
('Luxury Beachfront Villa', 'Exclusive beachfront villa with private pool and premium amenities', 'Vipingo, Kilifi', 250, 8, 'villa', ARRAY['wifi', 'parking', 'pool', 'kitchen', 'beach-access'], '/src/assets/hero-villa.jpg'),
('Oceanview Villa Paradise', 'Stunning oceanview villa perfect for special occasions', 'Diani Beach, Ukunda', 220, 7, 'villa', ARRAY['wifi', 'parking', 'pool', 'kitchen', 'ocean-view'], '/src/assets/hero-villa.jpg'),
('Cozy Kilifi Homestay', 'Authentic local experience with warm hospitality', 'Kilifi Town, Kilifi', 45, 2, 'homestay', ARRAY['wifi', 'parking'], '/src/assets/homestay-cottage.jpg'),
('Traditional Coastal Home', 'Experience the warmth of Kenyan hospitality in this authentic homestay', 'Malindi, Kilifi', 60, 4, 'homestay', ARRAY['wifi', 'parking', 'kitchen'], '/src/assets/homestay-cottage.jpg'),
('Family Diani Homestay', 'Perfect for families seeking an authentic cultural experience', 'Diani Beach, Ukunda', 75, 5, 'homestay', ARRAY['wifi', 'parking', 'kitchen'], '/src/assets/homestay-cottage.jpg'),
('Beachside Retreat', 'Charming homestay just steps from the pristine beaches of the coast', 'Watamu, Kilifi', 55, 3, 'homestay', ARRAY['wifi', 'parking'], '/src/assets/homestay-cottage.jpg'),
('Modern Kilifi Apartment', 'Contemporary apartment with all modern amenities', 'Kilifi Town, Kilifi', 85, 4, 'airbnb', ARRAY['wifi', 'parking', 'kitchen'], '/src/assets/airbnb-interior.jpg'),
('Luxury Ocean View Condo', 'Stunning luxury condominium with panoramic ocean views', 'Diani Beach, Ukunda', 150, 6, 'airbnb', ARRAY['wifi', 'parking', 'pool', 'kitchen'], '/src/assets/airbnb-interior.jpg'),
('Coastal Paradise Airbnb', 'Beautiful coastal apartment perfect for couples and small families', 'Malindi, Kilifi', 95, 3, 'airbnb', ARRAY['wifi', 'parking', 'kitchen'], '/src/assets/airbnb-interior.jpg'),
('Executive Beachfront Suite', 'Premium beachfront suite with exclusive amenities', 'Watamu, Kilifi', 120, 4, 'airbnb', ARRAY['wifi', 'parking', 'pool', 'kitchen'], '/src/assets/airbnb-interior.jpg');