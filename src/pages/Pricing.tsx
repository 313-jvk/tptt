import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Zap, Star, Crown, Loader2 } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  gradient: string;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: 'mois',
    description: 'Parfait pour découvrir TPT Niche Navigator',
    features: [
      '5 analyses de produits par mois',
      '3 recherches de mots-clés par mois',
      '1 analyse de magasin par mois',
      'Accès aux opportunités de base',
      'Support par email'
    ],
    icon: Zap,
    gradient: 'from-muted to-muted/50'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    period: 'mois',
    description: 'Idéal pour les vendeurs TPT sérieux',
    features: [
      '50 analyses de produits par mois',
      '25 recherches de mots-clés par mois',
      '10 analyses de magasins par mois',
      'Accès à toutes les opportunités',
      'Historique des analyses (30 jours)',
      'Support prioritaire',
      'Exportation des données'
    ],
    popular: true,
    icon: Star,
    gradient: 'from-primary to-secondary'
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 19,
    period: 'mois',
    description: 'Pour les power users et les équipes',
    features: [
      'Analyses illimitées',
      'Recherches de mots-clés illimitées',
      'Analyses de magasins illimitées',
      'Toutes les fonctionnalités Pro',
      'Historique complet (illimité)',
      'API access',
      'Support téléphonique',
      'Formation personnalisée',
      'Rapports avancés'
    ],
    icon: Crown,
    gradient: 'from-secondary to-accent'
  }
];

export const Pricing: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      toast({
        title: "Plan gratuit activé",
        description: "Vous pouvez maintenant commencer à utiliser TPT Niche Navigator !",
      });
      return;
    }

    setLoading(planId);
    
    // Simulation de la création de session Stripe
    setTimeout(() => {
      // Dans la réalité, cela appellerait une edge function pour créer une session Stripe
      const stripeUrl = `https://checkout.stripe.com/pay/cs_test_${planId}#fidkdWxOYHwnPyd1blpxYHZxWjA0T2w2UFFCR19UcGxhNXROd2NnVH1rN29JbU5wZ3UyMDFoa2FLY31jNDFAZDRiNjRTdU9EYmtnTE1SX2JidUhpTDVwVUduQGhiNzRPPScpJ2hsYXYnP34nYnBsYSc%2FJ2BrZGEnPydpYGxhJz8nY2JhZSc%2FJz9gd2AnPyd2d3En`;
      
      // Rediriger vers Stripe Checkout
      window.open(stripeUrl, '_blank');
      
      setLoading(null);
      
      toast({
        title: "Redirection vers Stripe",
        description: "Vous allez être redirigé vers la page de paiement sécurisée",
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Débloquez tout le potentiel de TPT Niche Navigator avec nos plans flexibles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isLoading = loading === plan.id;
          
          return (
            <Card 
              key={plan.id}
              className={`relative glass border-border/50 hover-lift transition-all duration-300 ${
                plan.popular ? 'border-primary/50 shadow-glow' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-medium">
                    Le plus populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {plan.price}€
                    </span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Button 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={`w-full transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90 shadow-glow' 
                      : 'bg-gradient-secondary hover:opacity-90'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : plan.price === 0 ? (
                    'Commencer gratuitement'
                  ) : (
                    'S\'abonner maintenant'
                  )}
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Fonctionnalités incluses :</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center space-y-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold">Questions fréquentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-sm text-muted-foreground">
              Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre compte.
            </p>
          </Card>
          
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Y a-t-il une période d'essai ?</h3>
            <p className="text-sm text-muted-foreground">
              Le plan gratuit vous permet de tester nos fonctionnalités sans limite de temps.
            </p>
          </Card>
          
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Comment fonctionne la facturation ?</h3>
            <p className="text-sm text-muted-foreground">
              Tous les plans sont facturés mensuellement. Vous pouvez annuler à tout moment.
            </p>
          </Card>
          
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Support client inclus ?</h3>
            <p className="text-sm text-muted-foreground">
              Tous les plans incluent un support par email, avec un support prioritaire pour les plans payants.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};