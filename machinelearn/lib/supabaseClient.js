import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fepshpsflpzaejqbizit.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHNocHNmbHB6YWVqcWJpeml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTQ2MjAsImV4cCI6MjA5MTczMDYyMH0.DUgB5ERwQNfxvlMS_4ji7FcmXMkwTEUA6nCgx7PY0uk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);