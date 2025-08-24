-- Add referral tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN referral_count INTEGER DEFAULT 0,
ADD COLUMN referral_earnings INTEGER DEFAULT 0;

-- Create index for faster referral code lookups
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, use it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Update existing users to have referral codes
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Make referral_code required for new users (will be handled in trigger)
-- Update the handle_new_user function to generate referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name'),
    'user',
    'free',
    generate_referral_code()
  );
  
  -- Create initial usage metrics
  INSERT INTO public.usage_metrics (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create function to update referral counts
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- If user was referred by someone, increment referrer's count
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.profiles 
    SET referral_count = referral_count + 1,
        referral_earnings = referral_earnings + 100 -- $1.00 in cents
    WHERE id = NEW.referred_by;
    
    -- Log the referral event
    INSERT INTO public.user_events (user_id, event_name, metadata)
    VALUES (
      NEW.referred_by,
      'referral_completed',
      jsonb_build_object(
        'referred_user_id', NEW.id,
        'referred_user_email', NEW.email,
        'referral_code', (SELECT referral_code FROM public.profiles WHERE id = NEW.referred_by),
        'completed_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update referral counts when new user is referred
CREATE TRIGGER on_profile_created_update_referral_count
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_count();