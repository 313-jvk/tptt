import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bookmark, 
  Search, 
  Store, 
  BarChart3,
  Calendar,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  Trash2
} from 'lucide-react';

export const SavedSearches: React.FC = () => {
  const savedItems = [
    {
      id: 1,
      type: 'product',
      title: 'Grade 3 Math Worksheets Bundle',
      url: 'https://teacherspayteachers.com/Product/...',
      savedDate: '2024-01-15',
      status: 'Opportunité élevée',
      metrics: {
        estimatedSales: 1950,
        estimatedProfit: 21450
      }
    },
    {
      id: 2,
      type: 'keyword',
      title: 'phonics worksheets',
      savedDate: '2024-01-14',
      status: 'Concurrence faible',
      metrics: {
        competitionLevel: 'Faible',
        averagePrice: 8.99
      }
    },
    {
      id: 3,
      type: 'store',
      title: 'Elementary Math Corner',
      url: 'https://teacherspayteachers.com/Store/Elementary-Math-Corner',
      savedDate: '2024-01-13',
      status: 'Magasin performant',
      metrics: {
        totalProducts: 127,
        monthlyRevenue: 8950
      }
    },
    {
      id: 4,
      type: 'keyword',
      title: 'reading comprehension grade 2',
      savedDate: '2024-01-12',
      status: 'Concurrence moyenne',
      metrics: {
        competitionLevel: 'Moyen',
        averagePrice: 12.50
      }
    },
    {
      id: 5,
      type: 'product',
      title: 'Sight Words Flash Cards',
      url: 'https://teacherspayteachers.com/Product/...',
      savedDate: '2024-01-10',
      status: 'Potentiel modéré',
      metrics: {
        estimatedSales: 847,
        estimatedProfit: 9317
      }
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return BarChart3;
      case 'keyword': return Search;
      case 'store': return Store;
      default: return Bookmark;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Produit';
      case 'keyword': return 'Mot-clé';
      case 'store': return 'Magasin';
      default: return 'Inconnu';
    }
  };

  const getStatusVariant = (status: string) => {
    if (status.includes('élevé') || status.includes('performant')) return 'default';
    if (status.includes('faible') || status.includes('Faible')) return 'secondary';
    if (status.includes('moyen') || status.includes('modéré')) return 'outline';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Mes Recherches Sauvegardées
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez et suivez vos analyses et recherches sauvegardées
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-primary/20 bg-primary-muted/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bookmark className="h-4 w-4" />
              Total sauvegardé
            </div>
            <div className="text-2xl font-bold text-primary">
              {savedItems.length}
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-secondary/20 bg-secondary-muted/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Opportunités actives
            </div>
            <div className="text-2xl font-bold text-secondary">
              {savedItems.filter(item => item.status.includes('élevé') || item.status.includes('performant')).length}
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-accent/20 bg-accent-muted/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Cette semaine
            </div>
            <div className="text-2xl font-bold text-accent">
              {savedItems.filter(item => 
                new Date(item.savedDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Éléments sauvegardés
          </CardTitle>
          <CardDescription>
            Cliquez sur un élément pour voir les détails ou le ré-analyser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedItems.map((item, index) => {
              const IconComponent = getTypeIcon(item.type);
              
              return (
                <Card key={item.id} className="p-4 hover:shadow-soft transition-smooth">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.savedDate).toLocaleDateString('fr-FR')}
                          </div>
                          <Badge variant={getStatusVariant(item.status)} className="text-xs">
                            {item.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          {item.type === 'product' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Ventes estimées: </span>
                                <span className="font-medium">{item.metrics.estimatedSales?.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Profit estimé: </span>
                                <span className="font-medium text-secondary">${item.metrics.estimatedProfit?.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          
                          {item.type === 'keyword' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Concurrence: </span>
                                <span className="font-medium">{item.metrics.competitionLevel}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Prix moyen: </span>
                                <span className="font-medium">${item.metrics.averagePrice}</span>
                              </div>
                            </>
                          )}
                          
                          {item.type === 'store' && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Produits: </span>
                                <span className="font-medium">{item.metrics.totalProducts}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Revenus/mois: </span>
                                <span className="font-medium text-secondary">${item.metrics.monthlyRevenue?.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {item.url && (
                          <div className="pt-2">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm"
                            >
                              Voir sur TPT
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Ré-analyser
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};