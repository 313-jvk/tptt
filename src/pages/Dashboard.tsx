//pages
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  DollarSign, 
  Search, 
  Store,
  BarChart3,
  Eye,
  Calendar,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Filter,
  Bell,
  BookOpen,
  Users,
  Award,
  RefreshCw,
  Star,
  Activity,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/hooks/use-toast';

// Types TypeScript pour les données
interface KeywordOpportunity {
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

interface TrendingProduct {
  id: number;
  product_url: string;
  title: string;
  price: number;
  store_name: string;
  ratings_count: number;
  average_rating: number;
  growth_rate: number;
  tags: string[];
  trend_status?: string;
}

interface UserAlert {
  id: number;
  user_id: number;
  alert_type: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

// Hook pour récupérer les opportunités depuis Supabase
interface Filters {
  competition: string;
  // ajoutez d'autres propriétés si nécessaire
}
const useKeywordOpportunities = (filters: Filters, searchTerm: string) => {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = useCallback(async () => { 
    try {
      setLoading(true);
      let query = supabase
        .from('best_opportunities')
        .select('*')
        .order('opportunity_score', { ascending: false })
        .limit(10);

      // Appliquer les filtres
      if (searchTerm) {
        query = query.ilike('keyword', `%${searchTerm}%`);
      }
      
      if (filters.competition !== 'all') {
        query = query.eq('competition_level', filters.competition);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des opportunités:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les opportunités",
          variant: "destructive"
        });
        return;
      }

      setOpportunities(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]); 
 

  useEffect(() => {
  fetchOpportunities();
}, [fetchOpportunities]);

  return { opportunities, loading, refetch: fetchOpportunities };
};

// Hook pour récupérer les produits tendance
const useTrendingProducts = () => {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('top_trending_products')
          .select('*')
          .order('growth_rate', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Erreur produits tendance:', error);
          return;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  return { products, loading };
};

// Hook pour récupérer les alertes utilisateur
const useUserAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('user_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Erreur alertes:', error);
          return;
        }

        setAlerts(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user]);

  const markAsRead = async (alertId: number) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (!error) {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, is_read: true } : alert
          )
        );
      }
    } catch (error) {
      console.error('Erreur mise à jour alerte:', error);
    }
  };

  return { alerts, loading, markAsRead };
};

// Hook pour les stats utilisateur
const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    productsAnalyzed: 0,
    keywordsExplored: 0,
    storesTracked: 0,
    potentialProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Analyses utilisateur ce mois-ci
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const { data: analyses, error: analysesError } = await supabase
          .from('user_analyses')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${thisMonth}-01`);

        // Mots-clés suivis
        const { data: keywords, error: keywordsError } = await supabase
          .from('user_tracked_keywords')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (analysesError || keywordsError) {
          console.error('Erreur stats:', analysesError || keywordsError);
          return;
        }

        // Calculer les stats
        const productAnalyses = analyses?.filter(a => a.analysis_type === 'product') || [];
        const keywordAnalyses = analyses?.filter(a => a.analysis_type === 'keyword') || [];
        const storeAnalyses = analyses?.filter(a => a.analysis_type === 'store') || [];

        // Calculer profit potentiel estimé
        const potentialProfit = productAnalyses.reduce((total, analysis) => {
          interface AnalysisData {
          estimatedRevenue?: number;
  // ajoutez d'autres propriétés
}
const data = analysis.data as AnalysisData;
          return total + (data?.estimatedRevenue || 0);
        }, 0);

        setStats({
          productsAnalyzed: productAnalyses.length,
          keywordsExplored: keywordAnalyses.length,
          storesTracked: storeAnalyses.length,
          potentialProfit: Math.round(potentialProfit)
        });

      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading };
};

// Composant OpportunityCard
const OpportunityCard = ({ opportunity, onClick }: { opportunity: KeywordOpportunity; onClick: () => void }) => {
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "Faible": return "text-green-500 bg-green-50 border-green-200";
      case "Moyen": return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "Élevé": return "text-red-500 bg-red-50 border-red-200";
      default: return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const getOpportunityGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-600";
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-violet-300 hover:border-l-violet-500" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base group-hover:text-violet-600 transition-colors">
              {opportunity.keyword}
            </CardTitle>
            <CardDescription className="text-sm">
              {opportunity.total_products} produits • ${opportunity.average_price} prix moyen
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${getCompetitionColor(opportunity.competition_level)}`}>
              {opportunity.competition_level}
            </Badge>
            {opportunity.data_freshness === "fresh" && (
              <Sparkles className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Score d'opportunité */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score d'opportunité</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getOpportunityGradient(opportunity.opportunity_score)} transition-all duration-500`}
                  style={{ width: `${opportunity.opportunity_score}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{opportunity.opportunity_score}/100</span>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Score:</span>
              <span className="font-semibold">{opportunity.competition_score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Note:</span>
              <span className="font-semibold">{opportunity.average_rating}/5</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant TrendingProductCard
const TrendingProductCard = ({ product }: { product: TrendingProduct }) => {
  const getTrendColor = (status?: string) => {
    switch (status) {
      case "hot": return "text-red-500 bg-red-50";
      case "trending": return "text-orange-500 bg-orange-50";
      default: return "text-blue-500 bg-blue-50";
    }
  };

  const getTrendIcon = (status?: string) => {
    switch (status) {
      case "hot": return <Zap className="h-3 w-3" />;
      case "trending": return <TrendingUp className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getTrendColor(product.trend_status)}`}>
            {getTrendIcon(product.trend_status)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-violet-600 transition-colors">
              {product.title}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">par {product.store_name}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">${product.price}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span>{product.ratings_count}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+{product.growth_rate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard principal
export const Dashboard = () => {
  const [filters, setFilters] = useState({
    subject: 'all',
    grade: 'all',
    competition: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks pour les données
  const { opportunities, loading: opportunitiesLoading, refetch } = useKeywordOpportunities(filters, searchTerm);
  const { products: trendingProducts, loading: productsLoading } = useTrendingProducts();
  const { alerts, loading: alertsLoading, markAsRead } = useUserAlerts();
  const { stats, loading: statsLoading } = useUserStats();

  const unreadAlertsCount = alerts.filter(alert => !alert.is_read).length;

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              Opportunities Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Découvrez les meilleures opportunités TPT en temps réel
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadAlertsCount > 0 && (
              <div className="relative">
                <Button variant="outline" className="relative">
                  <Bell className="h-4 w-4 mr-2" />
                  Alertes
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                    {unreadAlertsCount}
                  </Badge>
                </Button>
              </div>
            )}
            <Button onClick={refetch} disabled={opportunitiesLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${opportunitiesLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Opportunités</p>
                <p className="text-3xl font-bold text-violet-700">
                  {opportunities.filter(o => o.data_freshness === 'fresh').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 font-medium">Produits analysés</p>
                <p className="text-3xl font-bold text-cyan-700">{stats.productsAnalyzed}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Mots-clés explorés</p>
                <p className="text-3xl font-bold text-blue-700">{stats.keywordsExplored}</p>
              </div>
              <Search className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600 font-medium">Profit potentiel</p>
                <p className="text-3xl font-bold text-teal-700">${stats.potentialProfit}</p>
              </div>
              <DollarSign className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher des mots-clés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filters.competition} onValueChange={(value) => setFilters(prev => ({...prev, competition: value}))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Concurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Moyen">Moyen</SelectItem>
                  <SelectItem value="Élevé">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunités principales */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-violet-500" />
                    Meilleures Opportunités
                  </CardTitle>
                  <CardDescription>
                    {opportunities.length} opportunité(s) trouvée(s)
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {opportunities.filter(o => o.opportunity_score >= 80).length} Premium
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {opportunitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : opportunities.length > 0 ? (
                opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onClick={() => {
                      // Naviguer vers keyword explorer avec le mot-clé
                      window.location.href = `/keyword-explorer?q=${encodeURIComponent(opportunity.keyword)}`;
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune opportunité trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Produits tendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Produits Tendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : trendingProducts.length > 0 ? (
                trendingProducts.map((product) => (
                  <TrendingProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun produit tendance</p>
              )}
            </CardContent>
          </Card>

          {/* Alertes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-violet-500" />
                Alertes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border cursor-pointer ${
                      alert.is_read ? 'bg-gray-50' : 'bg-violet-50 border-violet-200'
                    }`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full mt-2 ${alert.is_read ? 'bg-gray-400' : 'bg-violet-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/keyword-explorer">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Explorer mots-clés
                </Button>
              </Link>
              <Link to="/store-spy">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Store className="h-4 w-4 mr-2" />
                  Espionner magasin
                </Button>
              </Link>
              <Link to="/product-analyzer">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyser produit
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};