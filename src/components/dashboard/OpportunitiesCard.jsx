// src/components/dashboard/OpportunitiesCard.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OpportunitiesCard = ({ opportunities, loading }) => {
  if (loading) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
            Opportunités du marché
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass shadow-glass hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary animate-float" />
              Opportunités du marché
            </CardTitle>
            <CardDescription>
              Niches à fort potentiel et faible concurrence
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/opportunities">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length > 0 ? (
          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-glass border border-border/30 hover:border-primary/30 hover:shadow-medium transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary/10 flex items-center justify-center group-hover:bg-gradient-primary/20 transition-colors duration-300">
                    <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {opportunity.keyword}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{opportunity.total_products?.toLocaleString() || 0} produits</span>
                      <span>•</span>
                      <span>${opportunity.average_price || 0} moy.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={opportunity.competition_level === 'Faible' ? 'secondary' : 'outline'}
                    className="group-hover:scale-105 transition-transform"
                  >
                    {opportunity.competition_level || 'Moyen'}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium text-secondary">
                      Score: {opportunity.opportunity_score || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune opportunité disponible pour le moment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// src/components/dashboard/AlertsCard.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, TrendingUp, Store, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const getAlertIcon = (alertType) => {
  switch (alertType) {
    case 'keyword_opportunity':
      return Search;
    case 'trending_product':
      return TrendingUp;
    case 'store_update':
      return Store;
    default:
      return AlertTriangle;
  }
};

const getAlertVariant = (alertType) => {
  switch (alertType) {
    case 'keyword_opportunity':
      return 'secondary';
    case 'trending_product':
      return 'default';
    case 'store_update':
      return 'outline';
    default:
      return 'destructive';
  }
};

export const AlertsCard = ({ alerts, loading, onMarkAsRead }) => {
  if (loading) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Vos alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass shadow-glass hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Vos alertes
              {alerts.filter(a => !a.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.filter(a => !a.is_read).length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Notifications et opportunités personnalisées
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/alerts">
              Gérer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const IconComponent = getAlertIcon(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group cursor-pointer ${
                    alert.is_read 
                      ? 'bg-muted/20 border-border/30 opacity-75' 
                      : 'bg-gradient-glass border-primary/30 hover:border-primary/50 hover:shadow-medium'
                  }`}
                  onClick={() => !alert.is_read && onMarkAsRead?.(alert.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      alert.is_read 
                        ? 'bg-muted/30' 
                        : 'bg-gradient-primary/10 group-hover:bg-gradient-primary/20'
                    }`}>
                      <IconComponent className={`h-4 w-4 transition-transform ${
                        alert.is_read 
                          ? 'text-muted-foreground' 
                          : 'text-primary group-hover:scale-110'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium transition-colors ${
                        alert.is_read 
                          ? 'text-muted-foreground' 
                          : 'group-hover:text-primary'
                      }`}>
                        {alert.title}
                      </p>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{new Date(alert.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getAlertVariant(alert.alert_type)} className="text-xs">
                      {alert.alert_type.replace('_', ' ')}
                    </Badge>
                    {!alert.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune alerte pour le moment
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Vos notifications apparaîtront ici
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};