import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { BarChart3, TrendingUp, Search, Store } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-white space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <BarChart3 className="h-12 w-12" />
              <h1 className="text-4xl lg:text-5xl font-bold">
                TPT Market Analyzer
              </h1>
            </div>
            <p className="text-xl text-white/90 max-w-lg">
              Analysez le marché Teachers Pay Teachers pour identifier les meilleures opportunités et maximiser vos profits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Analyse de Produits</h3>
              <p className="text-sm text-white/80">
                Estimez les ventes et profits de n'importe quel produit TPT
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Mots-clés</h3>
              <p className="text-sm text-white/80">
                Découvrez les mots-clés les plus rentables et la concurrence
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">Espion de Magasins</h3>
              <p className="text-sm text-white/80">
                Analysez les stratégies des vendeurs les plus performants
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pourquoi TPT Market Analyzer ?
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                Données en temps réel du marché TPT
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                Estimations précises de profits
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                Identification d'opportunités rentables
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                Suivi de la concurrence
              </li>
            </ul>
          </div>
        </div>

        {/* Auth Form */}
        <div className="flex justify-center">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};