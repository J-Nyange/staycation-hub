-- Migration: Link existing Clerk users to new Supabase accounts on first login
-- When a user signs in via Supabase, check if they have an existing profile (from Clerk era)
-- If yes, update that profile to use their new Supabase UUID instead of creating a duplicate

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  existing_profile_id UUID;
BEGIN
  -- Check if this email already has a profile (leftover from Clerk migration)
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_profile_id IS NOT NULL THEN
    -- Profile exists - UPDATE it to use new Supabase user_id
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      updated_at = NOW()
    WHERE id = existing_profile_id;
    
    RAISE NOTICE 'Linked existing profile % to new Supabase user %', existing_profile_id, NEW.id;
  ELSE
    -- No existing profile - CREATE new one
    INSERT INTO public.profiles (user_id, email, first_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    
    RAISE NOTICE 'Created new profile for Supabase user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Verify the trigger exists and is set up correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
