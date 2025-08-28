import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Zap, Star, Crown, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  paypalPlanId: string;
  limits: {
    productAnalysis: number;
    keywordSearch: number;
    storeAnalysis: number;
  };
}

interface UserSubscription {
  hasSubscription: boolean;
  subscription?: {
    subscriptionId: string;
    planId: string;
    planName: string;
    status: string;
    isActive: boolean;
    startDate?: string;
    nextBillingTime?: string;
  };
  plan?: string;
}

// Configuration des plans - Utilisation de valeurs par défaut côté client
const PAYPAL_PLAN_CONFIG = {
  // Les vrais IDs seront configurés côté serveur
  PRO_PLAN_ID: 'P-PLAN-PRO-NOT-CONFIGURED',
  EXPERT_PLAN_ID: 'P-PLAN-EXPERT-NOT-CONFIGURED'
};

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    period: 'mois',
    description: 'Parfait pour découvrir TPT Navigator',
    features: [
      '5 analyses de produits par mois',
      '3 recherches de mots-clés par mois',
      '1 analyse de magasin par mois',
      'Accès aux opportunités de base',
      'Support par email'
    ],
    icon: Zap,
    gradient: 'from-primary to-secondary',
    paypalPlanId: 'free',
    limits: {
      productAnalysis: 5,
      keywordSearch: 3,
      storeAnalysis: 1
    }
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
      'Exportation des données',
      'Paiement par carte Visa/Mastercard'
    ],
    popular: true,
    icon: Star,
    gradient: 'from-primary to-secondary',
    paypalPlanId: PAYPAL_PLAN_CONFIG.PRO_PLAN_ID,
    limits: {
      productAnalysis: 50,
      keywordSearch: 25,
      storeAnalysis: 10
    }
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
      'Rapports avancés',
      'Paiement par carte Visa/Mastercard'
    ],
    icon: Crown,
    gradient: 'from-secondary to-accent',
    paypalPlanId: PAYPAL_PLAN_CONFIG.EXPERT_PLAN_ID,
    limits: {
      productAnalysis: -1, // -1 = illimité
      keywordSearch: -1,
      storeAnalysis: -1
    }
  }
];

// Fonction pour vérifier si les plans PayPal sont configurés
const isPayPalConfigured = (planId: string): boolean => {
  return !planId.includes('NOT-CONFIGURED') && 
         !planId.includes('XXXXX') && 
         !planId.includes('YYYYY') &&
         planId !== 'free';
};

// Configuration de l'API URL
const getApiUrl = (): string => {
  // En développement, utilisez localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // En production, utilisez votre domaine de production
  return 'https://votre-domaine-api.com'; // À remplacer par votre vraie URL de production
};

export const Pricing: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [paypalConfigStatus, setPaypalConfigStatus] = useState<{configured: boolean, environment: string} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Vérifier la configuration PayPal
  useEffect(() => {
    const checkPayPalConfig = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/paypal/config-status`);
        if (response.ok) {
          const data = await response.json();
          setPaypalConfigStatus(data);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la configuration PayPal:', error);
        // En cas d'erreur, définir un état par défaut
        setPaypalConfigStatus({
          configured: false,
          environment: 'development'
        });
      }
    };

    checkPayPalConfig();
  }, []);

  // Récupérer les informations d'abonnement de l'utilisateur
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user?.id) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/user/${user.id}/subscription`, {
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'Content-Type': 'application/json',
            'user-id': user.id
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserSubscription(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'abonnement:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchUserSubscription();
  }, [user?.id]);

  const getCurrentPlan = (): string => {
    if (!userSubscription?.hasSubscription) return 'free';
    return userSubscription.subscription?.planId || 'free';
  };

  const isCurrentPlan = (planId: string): boolean => {
    const currentPlan = getCurrentPlan();
    return currentPlan === planId || 
           (currentPlan.includes(planId) && planId !== 'free');
  };

  const canUpgrade = (planId: string): boolean => {
    const currentPlan = getCurrentPlan();
    if (currentPlan === 'free') return planId !== 'free';
    if (currentPlan.includes('pro')) return planId === 'expert';
    return false;
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    // Plan gratuit
    if (plan.id === 'free') {
      toast({
        title: "Plan gratuit",
        description: "Vous utilisez déjà le plan gratuit !",
      });
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour souscrire à un abonnement.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si le plan PayPal est configuré
    if (!isPayPalConfigured(plan.paypalPlanId)) {
      toast({
        title: "Configuration en cours",
        description: "Ce plan sera bientôt disponible. Les plans PayPal sont en cours de configuration.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si c'est le plan actuel
    if (isCurrentPlan(plan.id)) {
      toast({
        title: "Plan actuel",
        description: "Vous êtes déjà abonné à ce plan.",
      });
      return;
    }

    setLoading(plan.id);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/paypal/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({ 
          planId: plan.paypalPlanId,
          userId: user.id,
          planName: plan.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.approvalUrl) {
        localStorage.setItem('pendingSubscriptionId', data.subscriptionId);
        localStorage.setItem('pendingPlanName', plan.name);
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("L'URL d'approbation PayPal n'a pas été reçue.");
      }
      
    } catch (error) {
      console.error('Erreur de souscription :', error);
      toast({
        title: "Erreur de souscription",
        description: error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la redirection vers PayPal. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription?.subscription?.subscriptionId) return;

    const confirmed = window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action ne peut pas être annulée.');
    if (!confirmed) return;

    try {
      setLoading('cancel');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/paypal/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || ''
        },
        body: JSON.stringify({
          subscriptionId: userSubscription.subscription.subscriptionId,
          reason: 'Annulation demandée par l\'utilisateur'
        })
      });

      if (response.ok) {
        toast({
          title: "Abonnement annulé",
          description: "Votre abonnement a été annulé avec succès.",
        });
        // Recharger les informations d'abonnement
        window.location.reload();
      } else {
        throw new Error('Erreur lors de l\'annulation');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'abonnement. Veuillez contacter le support.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const getButtonText = (plan: PricingPlan): string => {
    if (loading === plan.id) return 'Redirection...';
    if (isCurrentPlan(plan.id)) return 'Plan actuel';
    if (plan.id === 'free') return 'Plan gratuit';
    if (!isPayPalConfigured(plan.paypalPlanId)) return 'Bientôt disponible';
    if (canUpgrade(plan.id)) return 'Upgrader';
    return 'S\'abonner maintenant';
  };

  const isButtonDisabled = (plan: PricingPlan): boolean => {
    const isLoading = loading === plan.id;
    const isCurrent = isCurrentPlan(plan.id);
    const isNotConfigured = !isPayPalConfigured(plan.paypalPlanId);
    
    return isLoading || isCurrent || isNotConfigured;
  };

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Débloquez tout le potentiel de TPT Niche Navigator avec nos plans flexibles
        </p>
        
        {/* Statut de configuration PayPal */}
        {paypalConfigStatus && !paypalConfigStatus.configured && (
          <Alert className="max-w-2xl mx-auto border-yellow-500">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>Configuration en cours :</strong> Les plans payants seront disponibles une fois la configuration PayPal terminée.
              Environnement : {paypalConfigStatus.environment}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Affichage des informations d'abonnement actuel */}
      {userSubscription?.hasSubscription && userSubscription.subscription && (
        <Alert className="max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <div>
                <strong>Abonnement actuel :</strong> {userSubscription.subscription.planName} 
                {userSubscription.subscription.status && (
                  <Badge variant={userSubscription.subscription.isActive ? "default" : "destructive"} className="ml-2">
                    {userSubscription.subscription.status}
                  </Badge>
                )}
              </div>
              {userSubscription.subscription.isActive && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelSubscription}
                  disabled={loading === 'cancel'}
                >
                  {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Annuler'}
                </Button>
              )}
            </div>
            {userSubscription.subscription.nextBillingTime && (
              <p className="text-sm text-muted-foreground mt-1">
                Prochain paiement : {new Date(userSubscription.subscription.nextBillingTime).toLocaleDateString('fr-FR')}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isLoading = loading === plan.id;
          const isCurrent = isCurrentPlan(plan.id);
          const isNotConfigured = !isPayPalConfigured(plan.paypalPlanId);
          
          return (
            <Card 
              key={plan.id}
              className={`relative glass border-border/50 hover-lift transition-all duration-300 ${
                plan.popular ? 'border-primary/50 shadow-glow' : ''
              } ${isCurrent ? 'ring-2 ring-primary' : ''} ${isNotConfigured && plan.id !== 'free' ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-medium">
                    Le plus populaire
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white border-0">
                    Actuel
                  </Badge>
                </div>
              )}

              {isNotConfigured && plan.id !== 'free' && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-yellow-500 text-white border-0">
                    Bientôt
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
                  onClick={() => handleSubscribe(plan)}
                  disabled={isButtonDisabled(plan)}
                  className={`w-full transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-primary hover:opacity-90 shadow-glow' 
                      : 'bg-gradient-secondary hover:opacity-90'
                  } ${isButtonDisabled(plan) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {getButtonText(plan)}
                    </>
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

                {/* Affichage des limites */}
                <div className="pt-4 border-t border-border/50">
                  <h5 className="font-medium text-xs text-muted-foreground mb-2">LIMITES MENSUELLES</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Analyses produits:</span>
                      <span className="font-medium">
                        {plan.limits.productAnalysis === -1 ? '∞' : plan.limits.productAnalysis}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recherches mots-clés:</span>
                      <span className="font-medium">
                        {plan.limits.keywordSearch === -1 ? '∞' : plan.limits.keywordSearch}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analyses magasins:</span>
                      <span className="font-medium">
                        {plan.limits.storeAnalysis === -1 ? '∞' : plan.limits.storeAnalysis}
                      </span>
                    </div>
                  </div>
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
              Oui, vous pouvez upgrader votre plan à tout moment. Les downgrades prennent effet à la fin de la période de facturation.
            </p>
          </Card>
          
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Y a-t-il une période d'essai ?</h3>
            <p className="text-sm text-muted-foreground">
              Le plan gratuit vous permet de tester nos fonctionnalités sans limite de temps avec des quotas réduits.
            </p>
          </Card>
          
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Comment se passe le remboursement ?</h3>
            <p className="text-sm text-muted-foreground">
              Nous offrons une garantie de remboursement de 30 jours pour tous les plans payants.
            </p>
          </Card>

          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Comment puis-je annuler ?</h3>
            <p className="text-sm text-muted-foreground">
              Vous pouvez annuler directement depuis cette page ou via votre compte PayPal. L'annulation est immédiate.
            </p>
          </Card>

          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Quels moyens de paiement acceptez-vous ?</h3>
            <p className="text-sm text-muted-foreground">
              Nous acceptons PayPal ainsi que toutes les cartes Visa, Mastercard, American Express et Discover via PayPal.
            </p>
          </Card>

          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Sécurité des paiements</h3>
            <p className="text-sm text-muted-foreground">
              Tous les paiements sont sécurisés par PayPal avec chiffrement SSL. 
              Aucune donnée bancaire n'est stockée sur nos serveurs.
            </p>
          </Card>

          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Que se passe-t-il si j'atteins mes limites ?</h3>
            <p className="text-sm text-muted-foreground">
              Vous recevrez une notification lorsque vous approchez de vos limites. 
              Vous pourrez alors upgrader votre plan ou attendre le renouvellement mensuel.
            </p>
          </Card>

          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Support client</h3>
            <p className="text-sm text-muted-foreground">
              Plan Gratuit : Support par email. Plans Pro/Expert : Support prioritaire avec réponse sous 24h.
            </p>
          </Card>
        </div>

        {/* Informations supplémentaires sur les paiements */}
        <div className="mt-8 p-6 bg-muted/20 rounded-lg border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informations sur les paiements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Moyens de paiement acceptés :</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ PayPal</li>
                <li>✓ Visa</li>
                <li>✓ Mastercard</li>
                <li>✓ American Express</li>
                <li>✓ Discover</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sécurité :</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Chiffrement SSL 256-bits</li>
                <li>✓ Conformité PCI DSS</li>
                <li>✓ Données non stockées</li>
                <li>✓ Transactions sécurisées PayPal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Note sur la configuration */}
        {paypalConfigStatus && !paypalConfigStatus.configured && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Les abonnements payants seront activés dès que la configuration PayPal sera terminée.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};