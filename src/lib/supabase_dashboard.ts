/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/supabase-dashboard.ts
// Fonctions pour le Dashboard et système d'alertes

import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

// Types
export interface KeywordOpportunity {
  id: number;
  keyword: string;
  total_products: number;
  average_price: number;
  average_rating: number;
  competition_level: string;
  competition_score: number;
  opportunity_score: number;
  created_at: string;
  updated_at: string;
  data_freshness?: string;
}

export interface TrendingProduct {
  id: number;
  product_url: string;
  title: string;
  price: number;
  store_name: string;
  ratings_count: number;
  average_rating: number;
  estimated_sales: number;
  estimated_revenue: number;
  growth_rate: number;
  tags: string[];
  trend_status?: string;
}

export interface UserAlert {
  id: number;
  user_id: string;
  alert_type: string;
  title: string;
  description: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

// ===== FONCTIONS DE RÉCUPÉRATION DE DONNÉES =====

/**
 * Récupère les meilleures opportunités de mots-clés
 */
export const fetchKeywordOpportunities = async (filters?: {
  search?: string;
  competition?: string;
  limit?: number;
}): Promise<KeywordOpportunity[]> => {
  try {
    let query = supabase
      .from('best_opportunities')
      .select('*')
      .order('opportunity_score', { ascending: false });

    // Appliquer les filtres
    if (filters?.search) {
      query = query.ilike('keyword', `%${filters.search}%`);
    }
    
    if (filters?.competition && filters.competition !== 'all') {
      query = query.eq('competition_level', filters.competition);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur fetchKeywordOpportunities:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
};

/**
 * Récupère les produits tendance
 */
export const fetchTrendingProducts = async (limit = 5): Promise<TrendingProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('top_trending_products')
      .select('*')
      .order('growth_rate', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur fetchTrendingProducts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
};

/**
 * Récupère les alertes d'un utilisateur
 */
export const fetchUserAlerts = async (userId: string, limit = 10): Promise<UserAlert[]> => {
  try {
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur fetchUserAlerts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
};

/**
 * Récupère les stats d'un utilisateur
 */
export const fetchUserStats = async (userId: string) => {
  try {
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Analyses utilisateur ce mois-ci
    const { data: analyses, error: analysesError } = await supabase
      .from('user_analyses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${thisMonth}-01`);

    // Mots-clés suivis
    const { data: keywords, error: keywordsError } = await supabase
      .from('user_tracked_keywords')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (analysesError || keywordsError) {
      throw analysesError || keywordsError;
    }

    // Calculer les stats
    const productAnalyses = analyses?.filter(a => a.analysis_type === 'product') || [];
    const keywordAnalyses = analyses?.filter(a => a.analysis_type === 'keyword') || [];
    const storeAnalyses = analyses?.filter(a => a.analysis_type === 'store') || [];

    // Calculer profit potentiel estimé
    const potentialProfit = productAnalyses.reduce((total, analysis) => {
      const data = analysis.data as any;
      return total + (data?.estimatedRevenue || 0);
    }, 0);

    return {
      productsAnalyzed: productAnalyses.length,
      keywordsExplored: keywordAnalyses.length,
      storesTracked: storeAnalyses.length,
      potentialProfit: Math.round(potentialProfit)
    };

  } catch (error) {
    console.error('Erreur fetchUserStats:', error);
    return {
      productsAnalyzed: 0,
      keywordsExplored: 0,
      storesTracked: 0,
      potentialProfit: 0
    };
  }
};

// ===== FONCTIONS DE CRÉATION D'ALERTES =====

/**
 * Crée une nouvelle alerte pour un utilisateur
 */
export const createUserAlert = async (
  userId: string,
  alertType: string,
  title: string,
  description: string,
  data?: any
) => {
  try {
    const { error } = await supabase
      .from('user_alerts')
      .insert({
        user_id: userId,
        alert_type: alertType,
        title,
        description,
        data,
        is_read: false,
        is_active: true
      });

    if (error) {
      console.error('Erreur createUserAlert:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Marque une alerte comme lue
 */
export const markAlertAsRead = async (alertId: number) => {
  try {
    const { error } = await supabase
      .from('user_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      console.error('Erreur markAlertAsRead:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

// ===== FONCTIONS DE SAUVEGARDE D'ANALYSES =====

/**
 * Sauvegarde une analyse utilisateur
 */
export const saveUserAnalysis = async (
  userId: string,
  analysisType: 'product' | 'keyword' | 'store',
  data: any,
  targetUrl?: string,
  keyword?: string,
  title?: string
) => {
  try {
    const { error } = await supabase
      .from('user_analyses')
      .insert({
        user_id: userId,
        analysis_type: analysisType,
        target_url: targetUrl,
        keyword,
        title,
        data
      });

    if (error) {
      console.error('Erreur saveUserAnalysis:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Ajoute un mot-clé au suivi utilisateur
 */
export const addTrackedKeyword = async (
  userId: string,
  keyword: string,
  alertThreshold = 70
) => {
  try {
    const { error } = await supabase
      .from('user_tracked_keywords')
      .insert({
        user_id: userId,
        keyword,
        alert_threshold: alertThreshold,
        is_active: true
      });

    if (error) {
      console.error('Erreur addTrackedKeyword:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

// ===== FONCTIONS D'ADMINISTRATION/SCRAPING =====

/**
 * Ajoute ou met à jour une opportunité de mot-clé
 */
export const upsertKeywordOpportunity = async (keywordData: {
  keyword: string;
  total_products: number;
  average_price: number;
  average_rating: number;
  competition_level: string;
  competition_score: number;
}) => {
  try {
    const { error } = await supabase
      .from('keyword_opportunities')
      .upsert({
        ...keywordData,
        updated_at: new Date().toISOString(),
        last_scanned_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'keyword'
      });

    if (error) {
      console.error('Erreur upsertKeywordOpportunity:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Ajoute ou met à jour un produit tendance
 */
export const upsertTrendingProduct = async (productData: {
  product_url: string;
  title: string;
  price: number;
  store_name: string;
  store_url?: string;
  ratings_count: number;
  average_rating: number;
  estimated_sales: number;
  estimated_revenue: number;
  growth_rate: number;
  tags: string[];
}) => {
  try {
    const { error } = await supabase
      .from('trending_products')
      .upsert({
        ...productData,
        updated_at: new Date().toISOString(),
        last_scanned_at: new Date().toISOString(),
        is_trending: true
      }, {
        onConflict: 'product_url'
      });

    if (error) {
      console.error('Erreur upsertTrendingProduct:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

// ===== SYSTÈME D'ALERTES AUTOMATIQUES =====

/**
 * Vérifie et crée des alertes automatiques pour les utilisateurs
 */
export const processAutomaticAlerts = async () => {
  try {
    // Récupérer tous les mots-clés suivis par les utilisateurs
    const { data: trackedKeywords, error: keywordsError } = await supabase
      .from('user_tracked_keywords')
      .select(`
        *,
        users!inner(*)
      `)
      .eq('is_active', true);

    if (keywordsError) {
      console.error('Erreur récupération mots-clés suivis:', keywordsError);
      return;
    }

    // Pour chaque mot-clé suivi, vérifier les opportunités
    for (const tracked of trackedKeywords || []) {
      const { data: opportunity } = await supabase
        .from('keyword_opportunities')
        .select('*')
        .eq('keyword', tracked.keyword)
        .eq('is_active', true)
        .single();

      if (opportunity && opportunity.opportunity_score >= tracked.alert_threshold) {
        // Créer une alerte si pas déjà créée récemment
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentAlert } = await supabase
          .from('user_alerts')
          .select('id')
          .eq('user_id', tracked.user_id)
          .eq('alert_type', 'keyword_opportunity')
          .gte('created_at', yesterday.toISOString())
          .like('title', `%${tracked.keyword}%`)
          .single();

        if (!recentAlert) {
          await createUserAlert(
            tracked.user_id,
            'keyword_opportunity',
            `Opportunité détectée: ${tracked.keyword}`,
            `Le mot-clé "${tracked.keyword}" a un score d'opportunité de ${opportunity.opportunity_score}/100 avec une concurrence ${opportunity.competition_level.toLowerCase()}.`,
            {
              keyword: tracked.keyword,
              opportunity_score: opportunity.opportunity_score,
              competition_level: opportunity.competition_level,
              average_price: opportunity.average_price
            }
          );
        }
      }
    }

    console.log('Traitement automatique des alertes terminé');
  } catch (error) {
    console.error('Erreur processAutomaticAlerts:', error);
  }
};