import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronRight,
  TrendingDown,
  ExternalLink,
  Clock,
  ThumbsUp,
  ShoppingCart,
  PieChart,
  LineChart,
  AlertTriangle
} from 'lucide-react';

// Données simulées plus réalistes pour le dashboard
const mockOpportunities = [
  {
    id: 1,
    keyword: 'sight words kindergarten',
    total_products: 4200,
    average_price: 3.85,
    average_rating: 4.4,
    competition_level: 'Faible',
    opportunity_score: 92,
    growth_trend: 15.2,
    search_volume: 8900,
    last_updated: '2025-01-15'
  },
  {
    id: 2,
    keyword: 'math centers grade 2',
    total_products: 7800,
    average_price: 5.20,
    average_rating: 4.2,
    competition_level: 'Moyen',
    opportunity_score: 78,
    growth_trend: 8.7,
    search_volume: 12300,
    last_updated: '2025-01-15'
  },
  {
    id: 3,
    keyword: 'phonics activities',
    total_products: 15600,
    average_price: 4.10,
    average_rating: 4.3,
    competition_level: 'Élevé',
    opportunity_score: 65,
    growth_trend: -2.1,
    search_volume: 24500,
    last_updated: '2025-01-14'
  }
];

const mockTrendingProducts = [
  {
    id: 1,
    title: 'Interactive Math Centers Bundle - Grade 1',
    price: 8.50,
    store_name: 'MathMagicTeacher',
    ratings_count: 342,
    average_rating: 4.8,
    growth_rate: 156.7,
    revenue_estimate: 2907,
    trend_status: 'hot',
    category: 'Math'
  },
  {
    id: 2,
    title: 'Phonics Reading Comprehension Pack',
    price: 4.75,
    store_name: 'ReadingCorner',
    ratings_count: 189,
    average_rating: 4.6,
    growth_rate: 89.3,
    revenue_estimate: 898,
    trend_status: 'trending',
    category: 'Reading'
  }
];

const mockMarketInsights = [
  {
    category: 'Math',
    total_products: 45230,
    avg_price: 4.85,
    growth: 12.3,
    top_keywords: ['addition', 'subtraction', 'fractions']
  },
  {
    category: 'Reading',
    total_products: 62180,
    avg_price: 3.95,
    growth: 8.7,
    top_keywords: ['phonics', 'comprehension', 'fluency']
  },
  {
    category: 'Science',
    total_products: 18750,
    avg_price: 5.25,
    growth: 18.9,
    top_keywords: ['STEM', 'experiments', 'weather']
  }
];

const mockUserStats = {
  productsAnalyzed: 47,
  keywordsExplored: 23,
  storesTracked: 8,
  potentialProfit: 12450,
  thisMonthAnalyses: 12,
  successRate: 68,
  avgOpportunityScore: 74
};

const mockAlerts = [
  {
    id: 1,
    type: 'opportunity',
    title: 'Nouvelle opportunité détectée',
    description: 'Le mot-clé "winter activities kindergarten" présente un score de 87',
    time: '2h',
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'trending',
    title: 'Produit en forte croissance',
    description: 'Un produit STEM connaît +125% de croissance cette semaine',
    time: '4h',
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'competitor',
    title: 'Nouveau concurrent détecté',
    description: 'MathStarTeacher a ajouté 5 nouveaux produits dans votre niche',
    time: '1d',
    read: true,
    priority: 'low'
  }
];

// Composant pour les statistiques principales
const StatsCard = ({ title, value, change, icon: Icon, trend, description }) => (
  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-violet-400">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}% ce mois
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-violet-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-violet-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Composant pour les opportunités
const OpportunityCard = ({ opportunity, onExplore }) => {
  const getCompetitionColor = (level) => {
    switch (level) {
      case 'Faible': return 'bg-green-100 text-green-800 border-green-200';
      case 'Moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Élevé': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => onExplore(opportunity.keyword)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-lg hover:text-violet-600 transition-colors">
              {opportunity.keyword}
            </h4>
            <p className="text-sm text-muted-foreground">
              {opportunity.total_products.toLocaleString()} produits • ${opportunity.average_price} prix moyen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getCompetitionColor(opportunity.competition_level)}>
              {opportunity.competition_level}
            </Badge>
            {opportunity.growth_trend > 10 && (
              <Sparkles className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score d'opportunité</span>
            <div className="flex items-center gap-2">
              <Progress value={opportunity.opportunity_score} className="w-24 h-2" />
              <span className="text-sm font-bold text-violet-600">
                {opportunity.opportunity_score}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{(opportunity.search_volume / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Note:</span>
              <span className="font-medium">{opportunity.average_rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Tendance:</span>
              <span className={`font-medium ${opportunity.growth_trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {opportunity.growth_trend > 0 ? '+' : ''}{opportunity.growth_trend}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant principal du dashboard
export function Dashboard() { 
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

  const handleExploreKeyword = (keyword) => {
    // Simule la navigation vers l'explorer de mots-clés
    alert(`Navigation vers l'exploration du mot-clé: "${keyword}"`);
  };

  const handleAnalyzeProduct = (productUrl) => {
    // Simule l'analyse d'un produit
    alert(`Analyse du produit: ${productUrl}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
              TPT Niche Navigator
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Dashboard d'analyse du marché Teachers Pay Teachers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Alertes
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                  {mockAlerts.filter(a => !a.read).length}
                </Badge>
              </Button>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Produits analysés"
            value={mockUserStats.productsAnalyzed}
            change={mockUserStats.thisMonthAnalyses}
            trend="up"
            icon={BarChart3}
            description="Ce mois-ci"
          />
          <StatsCard
            title="Mots-clés explorés"
            value={mockUserStats.keywordsExplored}
            change={12}
            trend="up"
            icon={Search}
            description="Nouvelles niches découvertes"
          />
          <StatsCard
            title="Profit potentiel"
            value={`$${mockUserStats.potentialProfit.toLocaleString()}`}
            change={23}
            trend="up"
            icon={DollarSign}
            description="Estimation basée sur vos analyses"
          />
          <StatsCard
            title="Taux de réussite"
            value={`${mockUserStats.successRate}%`}
            change={5}
            trend="up"
            icon={Target}
            description="Opportunités validées"
          />
        </div>

        {/* Contenu principal avec onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Opportunités
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendances
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Opportunités principales */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-violet-500" />
                        Top Opportunités
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockOpportunities.slice(0, 3).map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        onExplore={handleExploreKeyword}
                      />
                    ))}
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
                      Produits en feu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockTrendingProducts.map((product) => (
                      <div key={product.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-red-50">
                            <Zap className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{product.title}</h4>
                            <p className="text-xs text-muted-foreground">par {product.store_name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold">${product.price}</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">+{product.growth_rate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Aperçu du marché */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-500" />
                      Aperçu Marché
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockMarketInsights.map((insight, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{insight.category}</span>
                          <Badge variant="secondary">
                            {insight.growth > 0 ? '+' : ''}{insight.growth}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {insight.total_products.toLocaleString()} produits • ${insight.avg_price} moy.
                        </div>
                        <Progress value={Math.min(insight.growth * 5, 100)} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <div className="flex items-center gap-4">
              <Input 
                placeholder="Rechercher des opportunités..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Concurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="eleve">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onExplore={handleExploreKeyword}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockTrendingProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="destructive" className="bg-red-500">
                        🔥 HOT +{product.growth_rate}%
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">par {product.store_name}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{product.average_rating}</span>
                          <span className="text-xs text-muted-foreground">({product.ratings_count})</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Revenus estimés: <span className="font-semibold text-green-600">${product.revenue_estimate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <Card key={alert.id} className={`${!alert.read ? 'border-violet-300 bg-violet-50/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-600' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {alert.type === 'opportunity' && <Lightbulb className="h-4 w-4" />}
                        {alert.type === 'trending' && <TrendingUp className="h-4 w-4" />}
                        {alert.type === 'competitor' && <Users className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{alert.time}</span>
                            {!alert.read && <div className="w-2 h-2 bg-violet-500 rounded-full" />}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" variant="outline">Voir détails</Button>
                          {!alert.read && (
                            <Button size="sm" variant="ghost">Marquer comme lu</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
