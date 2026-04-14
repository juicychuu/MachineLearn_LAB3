import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fepshpsflpzaejqbizit.supabase.co";
const supabaseAnonKey = "sb_publishable_0eUu_izPEVnJgwlghuI2BA_70byIEof";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);