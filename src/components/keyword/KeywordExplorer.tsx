import React, { useState, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  TrendingUp, 
  DollarSign, 
  Star, 
  Package,
  Bookmark,
  AlertCircle
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  totalProducts: number;
  averagePrice: number;
  averageRating: number;
  competitionLevel: 'Faible' | 'Moyen' | 'Élevé' | 'Très Élevé';
  competitionScore: number;
  relatedKeywords: { word: string; count: number; }[];
}

export const KeywordExplorer: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const { toast } = useToast();

  const exploreKeyword = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez entrer un mot-clé à analyser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setKeywordData(null); // Réinitialiser les données précédentes

    try {
        const response = await fetch('http://localhost:3000/api/analyze-keyword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword: keyword.trim() }),
        });

        if (!response.ok) {
            throw new Error(`Erreur du serveur: ${response.statusText}`);
        }

        const data: KeywordData = await response.json();
        setKeywordData(data);

        toast({
            title: "Analyse terminée",
            description: `L'analyse du mot-clé "${keyword}" est terminée`,
        });

    } catch (error: unknown) {
        console.error("Erreur lors de l'exploration du mot-clé:", error);
        toast({
            title: "Échec de l'analyse",
            description: "Impossible d'analyser le mot-clé. Veuillez réessayer plus tard.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  const saveKeyword = () => {
    toast({
      title: "Mot-clé sauvegardé",
      description: "Cette fonctionnalité n'est pas encore implémentée.",
    });
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'Faible': return 'text-green-500';
      case 'Moyen': return 'text-yellow-500';
      case 'Élevé': return 'text-orange-500';
      case 'Très Élevé': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getCompetitionBadgeVariant = (level: string) => {
    switch (level) {
      case 'Faible': return 'outline';
      case 'Moyen': return 'secondary';
      case 'Élevé': return 'destructive';
      case 'Très Élevé': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Explorateur de Mots-clés TPT
        </h1>
        <p className="text-muted-foreground mt-2">
          Analysez la concurrence et le potentiel des mots-clés sur Teachers Pay Teachers
        </p>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Explorer un mot-clé
          </CardTitle>
          <CardDescription>
            Entrez un mot-clé ou une phrase pour analyser sa performance sur TPT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Mot-clé ou phrase</Label>
            <Input
              id="keyword"
              placeholder="ex: phonics worksheets, grade 3 math, reading comprehension..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="transition-smooth focus:shadow-soft"
              onKeyDown={(e) => e.key === 'Enter' && exploreKeyword()}
            />
          </div>
          <Button 
            onClick={exploreKeyword} 
            disabled={!keyword.trim() || loading}
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            {loading ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Explorer le mot-clé
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {keywordData && (
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    Analyse de "{keyword}"
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Métriques détaillées de performance sur TPT
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveKeyword}
                  className="ml-4"
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-4 border-primary/20 bg-primary-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Niveau de concurrence
                    </div>
                    <div className="space-y-3">
                      <Badge 
                        variant={getCompetitionBadgeVariant(keywordData.competitionLevel)}
                        className="text-sm"
                      >
                        {keywordData.competitionLevel}
                      </Badge>
                      <Progress 
                        value={keywordData.competitionScore} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Score: {keywordData.competitionScore}/100
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border-secondary/20 bg-secondary-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Produits totaux 
                    </div>
                    <div className="text-2xl font-bold text-secondary">
                      {keywordData.totalProducts.toLocaleString()} + 
                    </div>
                    <p className="text-xs text-muted-foreground">
                      pour ce mot-clé
                    </p>
                  </div>
                </Card>
                
                <Card className="p-4 border-accent/20 bg-accent-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Prix moyen
                    </div>
                    <div className="text-2xl font-bold text-accent">
                      ${keywordData.averagePrice.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      pour ce mot-clé
                    </p>
                  </div>
                </Card>
                
                <Card className="p-4 border-primary/20 bg-primary-muted/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      Note moyenne
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {keywordData.averageRating.toFixed(1)} / 5.0
                    </div>
                    <p className="text-xs text-muted-foreground">
                      satisfaction moyenne
                    </p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Analyse de la concurrence
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Facilité d'entrée:</span>
                      <Badge 
                        variant={keywordData.competitionLevel === 'Faible' ? 'default' : 'secondary'}
                      >
                        {keywordData.competitionLevel === 'Faible' ? 'Facile' : 
                         keywordData.competitionLevel === 'Moyen' ? 'Modérée' : 'Difficile'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Potentiel de profit:</span>
                      <Badge 
                        variant={keywordData.competitionLevel === 'Faible' ? 'default' : 
                                 keywordData.competitionLevel === 'Moyen' ? 'secondary' : 'outline'}
                      >
                        {keywordData.competitionLevel === 'Faible' ? 'Élevé' : 
                         keywordData.competitionLevel === 'Moyen' ? 'Moyen' : 'Faible'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Recommandation:</span>
                      <span className={`text-sm font-medium ${getCompetitionColor(keywordData.competitionLevel)}`}>
                        {keywordData.competitionLevel === 'Faible' ? 'Créer maintenant' : 
                         keywordData.competitionLevel === 'Moyen' ? 'Opportunité intéressante' : 'Marché saturé'}
                      </span>
                    </div>
                  </div>

                
<Card className="p-4 mt-6">
  <h3 className="font-semibold mb-4 flex items-center gap-2 text-indigo-600">
    <TrendingUp className="h-4 w-4 text-indigo-500" />
    Top 10 Produits pour "{keyword}"
  </h3>
  <div className="space-y-3">
    {/* Placeholder en attendant les données backend */}
    {[...Array(10)].map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-3 rounded-xl border shadow-sm hover:bg-indigo-50 transition-colors"
      >
        {/* Partie gauche : Nom du produit (cliquable) */}
        <a
          href="#"
          className="text-sm font-medium text-indigo-700 hover:underline"
        >
          Produit #{i + 1}
        </a>

        {/* Partie droite : Prix + Évaluation */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-green-600">
            $ {(Math.random() * 50 + 10).toFixed(2)}
          </span>

          {/* Étoiles d’évaluation */}
          <div className="flex">
            {[...Array(5)].map((_, starIndex) => (
              <svg
                key={starIndex}
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${
                  starIndex < 4 ? "text-yellow-400" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.945a1 1 0 00.95.69h4.149c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.285 3.945c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.175 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.945a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.149a1 1 0 00.95-.69l1.286-3.945z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
</Card>


                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Mots-clés suggérés
                  </h3>
                  <div className="space-y-2">
                    {keywordData.relatedKeywords && keywordData.relatedKeywords.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => setKeyword(suggestion.word)} // CORRECTION ICI
                      >
                        <span className="text-sm">{suggestion.word} ({suggestion.count})</span> {/* MISE À JOUR ICI */}
                        <Button variant="ghost" size="sm">
                          <Search className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default KeywordExplorer;
