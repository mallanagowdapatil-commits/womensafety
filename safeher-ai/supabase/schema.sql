-- SafeHer AI Database Schema
-- Provides real-time emergency communication, contacts, and incident tracking

-- 1. EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  name TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'Guardian',
  phone TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. EMERGENCY INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  trigger_source TEXT DEFAULT 'sos_button' CHECK (trigger_source IN ('sos_button', 'chatbot', 'gesture', 'fall_detection')),
  initial_latitude DOUBLE PRECISION,
  initial_longitude DOUBLE PRECISION,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  location_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

-- 3. EMERGENCY NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'push', 'email', 'webhook')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  provider_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. EMERGENCY CALL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.emergency_incidents(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  call_type TEXT NOT NULL DEFAULT 'automated' CHECK (call_type IN ('direct', 'automated', 'webrtc')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),
  call_sid TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 5. DEVICE TOKENS TABLE (FOR FIREBASE PUSH NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'android', 'ios')),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LOCATION UPDATES TABLE (REALTIME LOCATION SHARING)
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON public.emergency_contacts(user_email);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_location_incident ON public.location_updates(incident_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

-- POLICIES (Allow authenticated users and service role access)
CREATE POLICY "Allow public anon access for demo resilience" ON public.emergency_contacts FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo incidents" ON public.emergency_incidents FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo notifications" ON public.emergency_notifications FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo calls" ON public.emergency_call_logs FOR ALL USING (true);
CREATE POLICY "Allow public anon access for device tokens" ON public.device_tokens FOR ALL USING (true);
CREATE POLICY "Allow public anon access for location updates" ON public.location_updates FOR ALL USING (true);

-- 7. EMERGENCY CALLS TABLE (EXOTEL PROGRAMMABLE VOICE API)
CREATE TABLE IF NOT EXISTS public.emergency_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergency_incidents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  contact_id TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  call_sid TEXT,
  call_status TEXT NOT NULL DEFAULT 'Initiated' CHECK (call_status IN ('Initiated', 'Ringing', 'Answered', 'Completed', 'Failed', 'Busy', 'No Answer')),
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EMERGENCY EVIDENCE RECORDING TABLE
CREATE TABLE IF NOT EXISTS public.emergency_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergency_incidents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'video')),
  file_name TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  storage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. JOURNEY TRACKING TABLE (SAFE ROUTE NAVIGATION & SHARING)
CREATE TABLE IF NOT EXISTS public.journey_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_latitude DOUBLE PRECISION NOT NULL,
  start_longitude DOUBLE PRECISION NOT NULL,
  current_latitude DOUBLE PRECISION NOT NULL,
  current_longitude DOUBLE PRECISION NOT NULL,
  tracking_status TEXT NOT NULL DEFAULT 'active' CHECK (tracking_status IN ('active', 'completed', 'cancelled')),
  shared_with TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. EMERGENCY EVENTS AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergency_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR NEW TABLES
CREATE INDEX IF NOT EXISTS idx_calls_emergency ON public.emergency_calls(emergency_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON public.emergency_evidence(user_email);
CREATE INDEX IF NOT EXISTS idx_journey_user ON public.journey_tracking(user_email);
CREATE INDEX IF NOT EXISTS idx_events_emergency ON public.emergency_events(emergency_id);

-- ENABLE ROW LEVEL SECURITY (RLS) FOR NEW TABLES
ALTER TABLE public.emergency_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Allow public anon access for demo emergency calls" ON public.emergency_calls FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo evidence" ON public.emergency_evidence FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo journey" ON public.journey_tracking FOR ALL USING (true);
CREATE POLICY "Allow public anon access for demo events" ON public.emergency_events FOR ALL USING (true);

