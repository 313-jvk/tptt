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
  AlertCircle,
  ExternalLink,
  Store
} from 'lucide-react';

interface TopProduct {
  title: string;
  url: string | null;
  price: number;
  ratingsCount: number;
  averageRating: number;
  storeName: string;
  storeUrl: string | null;
  estimatedSales: number;
  estimatedRevenue: number;
}

interface KeywordData {
  keyword: string;
  totalProducts: number;
  averagePrice: number;
  averageRating: number;
  competitionLevel: 'Faible' | 'Moyen' | 'Élevé' | 'Très Élevé';
  competitionScore: number;
  relatedKeywords: { word: string; count: number; }[];
  topProducts: TopProduct[]; // ⭐ NOUVELLE INTERFACE
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
    setKeywordData(null);

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

        const data = await response.json();
        setKeywordData({ ...data, keyword: keyword.trim() });

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

  // ⭐ Fonction pour rendre les étoiles
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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
                    Analyse de "{keywordData.keyword}"
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
                      {keywordData.totalProducts.toLocaleString()}
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
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-x">
                    <TrendingUp className="h-5 w-5" />
                    Top 10 Produits les plus populaires pour "{keywordData.keyword}"
                  </CardTitle>
                  <CardDescription>
                    Classés par nombre d'évaluations (indicateur de popularité)
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0" >
                  <div className="space-y-4">
                    {keywordData.topProducts && keywordData.topProducts.length > 0 ? (
                      keywordData.topProducts.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between bg-muted p-4  hover:bg-accent/20 transition-colors rounded-lg"
                        >
                          {/* Partie gauche : Détails du produit */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <a
                                  href={product.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold hover:text-indigo-900 hover:underline line-clamp-2 leading-5"
                                >
                                  {product.title}
                                  {product.url && <ExternalLink className="inline h-3 w-3 ml-1" />}
                                </a>
                              </div>
                            </div>
                            
                            {/* Magasin */}
                            <div className="flex items-center gap-2 ml-10">
                              <Store className="h-3 w-3 text-gray-500" />
                              <a
                                href={product.storeUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-600 hover:text-indigo-600 hover:underline"
                              >
                                {product.storeName}
                              </a>
                            </div>
                          </div>

                          {/* Partie droite : Métriques */}
                          <div className="flex flex-col items-end gap-2 ml-4">
                            {/* Prix */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-green-600">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                            
                            {/* Évaluations */}
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {renderStars(product.averageRating)}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({product.ratingsCount})
                              </span>
                            </div>
                            
                            {/* Estimation des ventes */}
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                ~{product.estimatedSales.toLocaleString()} ventes
                              </span>
                              <div className="text-xs text-green-600 font-medium">
                                ~${product.estimatedRevenue.toLocaleString()} revenus
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun produit trouvé pour ce mot-clé</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

                
                <Card className="p-4"> 

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
                </Card>
                <br />
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Mots-clés suggérés
                  </h3>
                  <div className="space-y-2">
                    {keywordData.relatedKeywords && keywordData.relatedKeywords.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-accent/20 transition-colors cursor-pointer"
                        onClick={() => setKeyword(suggestion.word)}
                      >
                        <span className="text-sm">{suggestion.word} ({suggestion.count})</span>
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