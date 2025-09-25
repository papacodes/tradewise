import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          phone: string | null
          website: string | null
          theme: 'light' | 'dark'
          currency: string
          language: string
          timezone: string
          email_notifications: boolean
          push_notifications: boolean
          trade_notifications: boolean
          marketing_notifications: boolean
          default_position_size: number
          risk_tolerance: 'low' | 'medium' | 'high'
          two_factor_enabled: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          theme?: 'light' | 'dark'
          currency?: string
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          trade_notifications?: boolean
          marketing_notifications?: boolean
          default_position_size?: number
          risk_tolerance?: 'low' | 'medium' | 'high'
          two_factor_enabled?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          phone?: string | null
          website?: string | null
          theme?: 'light' | 'dark'
          currency?: string
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          trade_notifications?: boolean
          marketing_notifications?: boolean
          default_position_size?: number
          risk_tolerance?: 'low' | 'medium' | 'high'
          two_factor_enabled?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trading_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          starting_balance: number
          current_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          starting_balance: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          starting_balance?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          account_id: string
          trade_name: string
          trade_date: string
          symbol: string
          news_impact: string | null
          market_bias: string
          trading_session: string
          entry_time: string
          entry_price: number
          stop_loss_price: number
          take_profit_price: number
          is_profitable: boolean
          pnl_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          trade_name: string
          trade_date: string
          symbol: string
          news_impact?: string | null
          market_bias: string
          trading_session: string
          entry_time: string
          entry_price: number
          stop_loss_price: number
          take_profit_price: number
          is_profitable: boolean
          pnl_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          trade_name?: string
          trade_date?: string
          symbol?: string
          news_impact?: string | null
          market_bias?: string
          trading_session?: string
          entry_time?: string
          entry_price?: number
          stop_loss_price?: number
          take_profit_price?: number
          is_profitable?: boolean
          pnl_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      confluence_options: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      mistake_options: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      trade_confluences: {
        Row: {
          id: string
          trade_id: string
          confluence_id: string
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          confluence_id: string
          created_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          confluence_id?: string
          created_at?: string
        }
      }
      trade_mistakes: {
        Row: {
          id: string
          trade_id: string
          mistake_id: string
          created_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          mistake_id: string
          created_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          mistake_id?: string
          created_at?: string
        }
      }
    }
  }
}