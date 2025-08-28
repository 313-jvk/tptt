//types.ts 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          name: string
          password: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          name: string
          password: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          password?: string
        }
        Relationships: []
      }
      keyword_opportunities: {
        Row: {
          id: number
          keyword: string
          total_products: number | null
          average_price: number | null
          average_rating: number | null
          competition_level: string | null
          competition_score: number | null
          opportunity_score: number | null
          created_at: string | null
          updated_at: string | null
          last_scanned_at: string | null
          is_active: boolean | null
        }
        Insert: {
          keyword: string
          total_products?: number | null
          average_price?: number | null
          average_rating?: number | null
          competition_level?: string | null
          competition_score?: number | null
          opportunity_score?: number | null
          created_at?: string | null
          updated_at?: string | null
          last_scanned_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          keyword?: string
          total_products?: number | null
          average_price?: number | null
          average_rating?: number | null
          competition_level?: string | null
          competition_score?: number | null
          opportunity_score?: number | null
          created_at?: string | null
          updated_at?: string | null
          last_scanned_at?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      trending_products: {
        Row: {
          id: number
          product_url: string
          title: string | null
          price: number | null
          store_name: string | null
          store_url: string | null
          ratings_count: number | null
          average_rating: number | null
          estimated_sales: number | null
          estimated_revenue: number | null
          growth_rate: number | null
          tags: string[] | null
          date_added: string | null
          created_at: string | null
          updated_at: string | null
          last_scanned_at: string | null
          is_trending: boolean | null
        }
        Insert: {
          product_url: string
          title?: string | null
          price?: number | null
          store_name?: string | null
          store_url?: string | null
          ratings_count?: number | null
          average_rating?: number | null
          estimated_sales?: number | null
          estimated_revenue?: number | null
          growth_rate?: number | null
          tags?: string[] | null
          date_added?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_scanned_at?: string | null
          is_trending?: boolean | null
        }
        Update: {
          product_url?: string
          title?: string | null
          price?: number | null
          store_name?: string | null
          store_url?: string | null
          ratings_count?: number | null
          average_rating?: number | null
          estimated_sales?: number | null
          estimated_revenue?: number | null
          growth_rate?: number | null
          tags?: string[] | null
          date_added?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_scanned_at?: string | null
          is_trending?: boolean | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          id: number
          user_id: number
          alert_type: string
          title: string
          description: string | null
          data: Json | null
          is_read: boolean | null
          is_active: boolean | null
          created_at: string | null
          expires_at: string | null
        }
        Insert: {
          user_id: number
          alert_type: string
          title: string
          description?: string | null
          data?: Json | null
          is_read?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
        }
        Update: {
          user_id?: number
          alert_type?: string
          title?: string
          description?: string | null
          data?: Json | null
          is_read?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_analyses: {
        Row: {
          id: number
          user_id: number
          analysis_type: string
          target_url: string | null
          keyword: string | null
          title: string | null
          data: Json
          created_at: string | null
        }
        Insert: {
          user_id: number
          analysis_type: string
          target_url?: string | null
          keyword?: string | null
          title?: string | null
          data: Json
          created_at?: string | null
        }
        Update: {
          user_id?: number
          analysis_type?: string
          target_url?: string | null
          keyword?: string | null
          title?: string | null
          data?: Json
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_tracked_keywords: {
        Row: {
          id: number
          user_id: number
          keyword: string
          alert_threshold: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          user_id: number
          keyword: string
          alert_threshold?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          user_id?: number
          keyword?: string
          alert_threshold?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tracked_keywords_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      best_opportunities: {
        Row: {
          id: number | null
          keyword: string | null
          total_products: number | null
          average_price: number | null
          average_rating: number | null
          competition_level: string | null
          competition_score: number | null
          opportunity_score: number | null
          created_at: string | null
          updated_at: string | null
          last_scanned_at: string | null
          is_active: boolean | null
          data_freshness: string | null
        }
      }
      top_trending_products: {
        Row: {
          id: number | null
          product_url: string | null
          title: string | null
          price: number | null
          store_name: string | null
          store_url: string | null
          ratings_count: number | null
          average_rating: number | null
          estimated_sales: number | null
          estimated_revenue: number | null
          growth_rate: number | null
          tags: string[] | null
          date_added: string | null
          created_at: string | null
          updated_at: string | null
          last_scanned_at: string | null
          is_trending: boolean | null
          trend_status: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types d'aide pour les alertes
export type AlertType = 'keyword_opportunity' | 'trending_product' | 'store_update' | 'price_drop' | 'new_competitor';
export type AnalysisType = 'product' | 'keyword' | 'store';
export type CompetitionLevel = 'Faible' | 'Moyen' | 'Élevé' | 'Très Élevé';
export type TrendStatus = 'hot' | 'trending' | 'stable';
export type DataFreshness = 'fresh' | 'recent' | 'old';

// Interfaces pour faciliter l'utilisation
export interface KeywordOpportunity {
  id: number;
  keyword: string;
  total_products: number;
  average_price: number;
  average_rating: number;
  competition_level: CompetitionLevel;
  competition_score: number;
  opportunity_score: number;
  data_freshness?: DataFreshness;
  updated_at: string;
}

export interface TrendingProduct {
  id: number;
  product_url: string;
  title: string;
  price: number;
  store_name: string;
  ratings_count: number;
  growth_rate: number;
  trend_status?: TrendStatus;
  tags: string[];
}

export interface UserAlert {
  id: number;
  user_id: number;
  alert_type: AlertType;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  productsAnalyzed: number;
  keywordsExplored: number;
  storesTracked: number;
  potentialProfit: number;
  newAlerts: number;
  trendingOpportunities: number;
}