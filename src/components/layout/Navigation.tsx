import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Search, 
  Store, 
  Bookmark,
  TrendingUp,
  Home
} from 'lucide-react';

const navItems = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: Home,
    description: 'Vue d\'ensemble de vos analyses'
  },
  {
    title: 'Analyser un produit',
    href: '/product-analyzer',
    icon: BarChart3,
    description: 'Analyser un produit TPT spécifique'
  },
  {
    title: 'Explorateur de mots-clés',
    href: '/keyword-explorer',
    icon: Search,
    description: 'Analyser la concurrence des mots-clés'
  },
  {
    title: 'Espion de magasin',
    href: '/store-spy',
    icon: Store,
    description: 'Analyser les performances des magasins'
  },
  {
    title: 'Abonnement',
    href: '/Pricing',
    icon: TrendingUp,
    description: 'Accédez à des fonctionnalités avancées pour maximiser votre potentiel sur TPT'
  },
  {
    title: 'Account',
    href: '/Account',
    icon: TrendingUp,
    description: 'Découvrir de nouvelles opportunités'
  }
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="w-64 glass border-r border-border/50 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group hover-lift",
                  isActive 
                    ? "bg-gradient-primary text-primary-foreground shadow-glow border border-primary/20" 
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground hover:shadow-medium"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {isActive && (
                    <div className="absolute inset-0 bg-primary-foreground/20 rounded-full blur-sm"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="transition-colors duration-300">{item.title}</span>
                  {!isActive && (
                    <span className="text-xs text-muted-foreground/70 transition-colors duration-300 group-hover:text-muted-foreground">
                      {item.description}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="ml-auto w-1 h-6 bg-primary-foreground/30 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};