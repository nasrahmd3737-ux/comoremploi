CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  IF NEW.email = 'samirabdillah@icloud.com' THEN
    _role := 'admin';
  ELSE
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'candidate');
  END IF;

  INSERT INTO public.profiles (user_id, role, full_name, email, location)
  VALUES (
    NEW.id,
    _role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'location'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;