import React from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Search, 
  Store,
  BarChart3,
  Eye,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const recentAnalyses = [
    {
      type: 'product',
      title: 'Grade 3 Math Worksheets Bundle',
      date: '2024-01-15',
      status: 'Opportunité élevée',
      estimatedProfit: 2450
    },
    {
      type: 'keyword',
      title: 'phonics worksheets',
      date: '2024-01-14',
      status: 'Concurrence faible',
      competition: 'Faible'
    },
    {
      type: 'store',
      title: 'Elementary Math Corner',
      date: '2024-01-13',
      status: 'Magasin performant',
      products: 127
    }
  ];

  return (
    <div className="space-y-6">
      <div className="relative">
        <h1 className="text-4xl font-bold bg-gradient-hero bg-200% bg-clip-text text-transparent animate-gradient-shift">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Vue d'ensemble de vos analyses et opportunités TPT
        </p>
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-xl animate-pulse-soft"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Produits analysés"
          value="47"
          description="ce mois-ci"
          icon={BarChart3}
          trend={{ value: 12, label: "vs mois dernier", positive: true }}
          variant="default"
        />
        <StatsCard
          title="Mots-clés explorés"
          value="23"
          description="recherches actives"
          icon={Search}
          trend={{ value: 8, label: "cette semaine", positive: true }}
          variant="success"
        />
        <StatsCard
          title="Magasins suivis"
          value="12"
          description="en surveillance"
          icon={Store}
          trend={{ value: 3, label: "nouveaux", positive: true }}
          variant="warning"
        />
        <StatsCard
          title="Profit potentiel"
          value="$18.7k"
          description="estimé total"
          icon={DollarSign}
          trend={{ value: 15, label: "ce mois", positive: true }}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="glass shadow-glass hover-lift group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
              <TrendingUp className="h-5 w-5 group-hover:animate-float" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Outils d'analyse principaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/product-analyzer">
              <Button className="w-full justify-start bg-gradient-primary hover:bg-gradient-hero transition-all duration-300 hover:shadow-glow hover:scale-[1.02] group">
                <BarChart3 className="mr-3 h-4 w-4 group-hover:animate-float" />
                Analyser un produit
              </Button>
            </Link>
            <Link to="/keyword-explorer">
              <Button variant="outline" className="w-full justify-start hover:bg-gradient-secondary/10 hover:border-secondary/40 transition-all duration-300 hover:shadow-medium group">
                <Search className="mr-3 h-4 w-4 group-hover:text-secondary transition-colors" />
                Explorer des mots-clés
              </Button>
            </Link>
            <Link to="/store-spy">
              <Button variant="outline" className="w-full justify-start hover:bg-gradient-accent/10 hover:border-accent/40 transition-all duration-300 hover:shadow-medium group">
                <Store className="mr-3 h-4 w-4 group-hover:text-accent transition-colors" />
                Espionner un magasin
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card className="lg:col-span-2 glass shadow-glass hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Analyses récentes
                </CardTitle>
                <CardDescription>
                  Vos dernières recherches et analyses
                </CardDescription>
              </div>
              <Link to="/saved-searches">
                <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 group">
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((analysis, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-glass border border-border/30 hover:border-primary/30 hover:shadow-medium transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary/10 flex items-center justify-center group-hover:bg-gradient-primary/20 transition-colors duration-300">
                      {analysis.type === 'product' && <BarChart3 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />}
                      {analysis.type === 'keyword' && <Search className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />}
                      {analysis.type === 'store' && <Store className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">{analysis.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(analysis.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="group-hover:bg-secondary/20 transition-colors">{analysis.status}</Badge>
                    {analysis.estimatedProfit && (
                      <span className="text-sm font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-lg">
                        ${analysis.estimatedProfit.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Overview */}
      <Card className="glass shadow-glass hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary animate-float" />
            Opportunités du moment
          </CardTitle>
          <CardDescription>
            Créneaux à fort potentiel identifiés par nos analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative p-5 rounded-xl border border-secondary/30 bg-gradient-secondary/10 hover:bg-gradient-secondary/15 transition-all duration-300 hover-lift group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-semibold text-secondary mb-2 relative z-10">Mathématiques primaire</h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">
                Forte demande, concurrence modérée
              </p>
              <div className="flex justify-between items-center relative z-10">
                <Badge variant="default" className="bg-secondary/20 text-secondary border-secondary/30">Concurrence: Faible</Badge>
                <span className="text-sm font-medium bg-secondary/10 px-2 py-1 rounded-lg">$15k+ potentiel</span>
              </div>
            </div>
            
            <div className="relative p-5 rounded-xl border border-warning/30 bg-gradient-warning/10 hover:bg-gradient-warning/15 transition-all duration-300 hover-lift group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-warning/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-semibold text-warning mb-2 relative z-10">Lecture fluide</h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">
                Marché en croissance, niche spécialisée
              </p>
              <div className="flex justify-between items-center relative z-10">
                <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">Concurrence: Moyenne</Badge>
                <span className="text-sm font-medium bg-warning/10 px-2 py-1 rounded-lg">$8k+ potentiel</span>
              </div>
            </div>
            
            <div className="relative p-5 rounded-xl border border-primary/30 bg-gradient-primary/10 hover:bg-gradient-primary/15 transition-all duration-300 hover-lift group overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="font-semibold text-primary mb-2 relative z-10">Sciences maternelle</h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">
                Nouveau créneau émergent
              </p>
              <div className="flex justify-between items-center relative z-10">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Concurrence: Très faible</Badge>
                <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded-lg">$12k+ potentiel</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};