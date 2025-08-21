import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RotateCcw, HelpCircle } from 'lucide-react';

export const Cancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground">
            Paiement annulé
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Votre paiement a été annulé. Aucun montant n'a été débité.
          </p>
        </div>

        <Card className="glass shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 justify-center">
              <div className="p-2 rounded-xl bg-gradient-to-br from-muted to-muted/70">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              Que s'est-il passé ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-left space-y-4">
              <p className="text-sm text-muted-foreground">
                Le processus de paiement a été interrompu. Cela peut arriver pour plusieurs raisons :
              </p>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2"></span>
                  <span>Vous avez fermé la fenêtre de paiement</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2"></span>
                  <span>Problème technique temporaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2"></span>
                  <span>Information de carte incorrecte</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Vous pouvez toujours :
              </h3>
              <ul className="space-y-1 text-sm">
                <li>• Utiliser notre plan gratuit</li>
                <li>• Réessayer l'abonnement plus tard</li>
                <li>• Contacter notre support pour de l'aide</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/pricing')}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 hover-lift"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass p-6">
            <h3 className="font-semibold mb-2">Commencez avec le plan gratuit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pas de problème ! Vous pouvez toujours explorer TPT Niche Navigator avec notre plan gratuit et voir si notre plateforme vous convient.
            </p>
            <Button 
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Découvrir le plan gratuit
            </Button>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            Besoin d'aide ? Notre équipe de support est là pour vous.
            <br />
            Contactez-nous à support@tptniche.com
          </p>
        </div>
      </div>
    </div>
  );
};