import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Crown, Zap } from 'lucide-react';

export const Success: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // on verifierait ici le statut de paiement avec Stripe + on mettrait a jour le statut d'abonnement de l'utilisateur
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center animate-pulse-soft">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Paiement réussi !
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Bienvenue dans TPT Niche Navigator Premium
          </p>
        </div>

        <Card className="glass shadow-strong border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 justify-center">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              Votre abonnement est maintenant actif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Analyses illimitées</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analysez autant de produits et mots-clés que vous le souhaitez
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Toutes les fonctionnalités</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accès complet à tous les outils de TPT Niche Navigator
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Prochaines étapes :</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span className="text-sm">Explorez votre tableau de bord mis à jour</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                  <span className="flex-shrink-0 w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span className="text-sm">Commencez à analyser vos premiers produits TPT</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span className="text-sm">Découvrez les opportunités de niche cachées</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow"
              >
                Accéder au tableau de bord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/analyze')}
                className="flex-1 hover-lift"
              >
                Analyser mon premier produit
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            Un email de confirmation a été envoyé à votre adresse.
            <br />
            Besoin d'aide ? Contactez notre support à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
};