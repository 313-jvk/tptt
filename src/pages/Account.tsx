import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  CreditCard, 
  Settings, 
  Download,
  Trash2,
  Crown,
  Calendar,
  BarChart3
} from 'lucide-react';

export const Account: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Vos données seront envoyées par email sous peu",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Suppression de compte",
      description: "Contactez le support pour supprimer votre compte",
      variant: "destructive",
    });
  };

  const handleManageSubscription = () => {
    toast({
      title: "Gestion d'abonnement",
      description: "Redirection vers le portail de gestion...",
    });
  };

  // Données simulées d'abonnement
  const subscriptionData = {
    plan: 'Pro',
    status: 'active',
    nextBilling: '2024-02-15',
    price: 9
  };

  // Statistiques simulées
  const stats = {
    productAnalyses: 127,
    keywordSearches: 89,
    storeAnalyses: 23,
    joinDate: '2024-01-10'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Mon Compte
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre profil et vos paramètres de compte
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass shadow-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                Informations du profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Membre depuis</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(stats.joinDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-secondary">
                  <CreditCard className="h-5 w-5 text-secondary-foreground" />
                </div>
                Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Plan {subscriptionData.plan}</p>
                    <p className="text-sm text-muted-foreground">{subscriptionData.price}€/mois</p>
                  </div>
                </div>
                <Badge 
                  variant={subscriptionData.status === 'active' ? 'default' : 'secondary'}
                  className="bg-secondary/20 text-secondary border-secondary/30"
                >
                  {subscriptionData.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prochaine facturation:</span>
                  <span>{new Date(subscriptionData.nextBilling).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  className="flex-1"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Gérer l'abonnement
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-accent">
                  <Settings className="h-5 w-5 text-accent-foreground" />
                </div>
                Paramètres du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  className="justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter mes données
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="justify-start"
                >
                  Se déconnecter
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Zone de danger</h4>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  size="sm"
                  className="justify-start"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le compte
                </Button>
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible. Toutes vos données seront supprimées.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass shadow-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-primary">
                  <BarChart3 className="h-5 w-5 text-primary-foreground" />
                </div>
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Analyses de produits</span>
                    <span className="font-bold text-primary">{stats.productAnalyses}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recherches de mots-clés</span>
                    <span className="font-bold text-secondary">{stats.keywordSearches}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Analyses de magasins</span>
                    <span className="font-bold text-accent">{stats.storeAnalyses}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-strong border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Notre équipe de support est là pour vous aider avec toutes vos questions.
              </p>
              
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Contacter le support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};