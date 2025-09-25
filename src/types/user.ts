export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  two_factor_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: 'light' | 'dark';
}