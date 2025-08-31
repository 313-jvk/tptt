import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { analyzeTPTProduct } from '@/api/tptScraper';
import { 
  Search, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Calendar,
  ExternalLink,
  Bookmark,
  Store,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductData {
  title?: string;
  description?: string;
  price?: number | null;
  ratingsCount?: number | null;
  averageRating?: number | null;
  storeName?: string;
  storeUrl?: string;
  pageDetails?: number | null;
  dateAdded?: string | null;
  estimatedSales?: number | null;
  estimatedProfit?: number | null;
  tags?: string[];
  url: string;
}

export const ProductAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateUrl = (url: string): boolean => {
    const validPatterns = [
      'teacherspayteachers.com/Product/',
      'tpt.com/Product/'
    ];
    return validPatterns.some(pattern => url.includes(pattern));
  };

  const analyzeProduct = async () => {
    if (!url.trim()) {
      toast({
        title: "URL manquante",
        description: "Veuillez entrer une URL de produit TPT.",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(url)) {
      toast({
        title: "URL invalide",
        description: "Veuillez entrer une URL de produit TPT valide (doit contenir '/Product/').",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setProductData(null);

    try {
      console.log('Début analyse pour URL:', url);
      
      const data = await analyzeTPTProduct(url);
      console.log('Données reçues:', data);

      if (!data) {
        throw new Error("Aucune donnée reçue du serveur");
      }

      // Construire l'objet productData avec des valeurs par défaut
      const processedData: ProductData = {
        title: data.title || 'Titre non disponible',
        description: data.description || 'Description non disponible',
        price: typeof data.price === 'number' ? data.price : null,
        ratingsCount: typeof data.ratingsCount === 'number' ? data.ratingsCount : null,
        averageRating: typeof data.averageRating === 'number' ? data.averageRating : null,
        storeName: data.storeName || 'Magasin non identifié',
        storeUrl: data.storeUrl || '',
        pageDetails: typeof data.pageDetails === 'number' ? data.pageDetails : null,
        dateAdded: data.dateAdded || null,
        estimatedSales: typeof data.estimatedSales === 'number' ? data.estimatedSales : null,
        estimatedProfit: typeof data.estimatedProfit === 'number' ? data.estimatedProfit : null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: url
      };

      setProductData(processedData);

      toast({
        title: "Analyse terminée",
        description: "Les données du produit ont été analysées avec succès",
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erreur d'analyse du produit:", error);
      
      let errorMessage = "Une erreur inconnue s'est produite";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Erreur d'analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = () => {
    if (productData) {
      // Sauvegarder dans localStorage ou envoyer vers votre API
      const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
      savedProducts.unshift({
        ...productData,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('savedProducts', JSON.stringify(savedProducts.slice(0, 50))); // Garder max 50
      
      toast({
        title: "Produit sauvegardé",
        description: "Ce produit a été ajouté à vos recherches sauvegardées",
      });
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toLocaleString('fr-FR');
  };

  const formatCurrency = (num: number | null | undefined): string => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Analyseur de Produit TPT
        </h1>
        <p className="text-muted-foreground mt-2">
          Analysez les performances et le potentiel d'un produit Teachers Pay Teachers
        </p>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Analyser un produit
          </CardTitle>
          <CardDescription>
            Entrez l'URL du produit TPT que vous souhaitez analyser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-url">URL du produit TPT</Label>
            <Input
              id="product-url"
              placeholder="https://www.teacherspayteachers.com/Product/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="transition-smooth focus:shadow-soft"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={analyzeProduct} 
            disabled={!url.trim() || loading}
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyser le produit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erreur:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {productData && (
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{productData.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {productData.description}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveProduct}
                  className="ml-4"
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Prix
                  </div>
                  <div className="text-2xl font-bold text-secondary">
                    {formatCurrency(productData.price)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Évaluations
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {formatNumber(productData.ratingsCount)}
                    </span>
                    {productData.averageRating && (
                      <Badge variant="secondary">
                        {productData.averageRating.toFixed(1)}/5
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Ventes estimées
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(productData.estimatedSales)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Profit estimé
                  </div>
                  <div className="text-2xl font-bold text-secondary">
                    {formatCurrency(productData.estimatedProfit)}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Détails du produit
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre de pages:</span>
                      <span className="font-medium">
                        {productData.pageDetails ? productData.pageDetails : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date d'ajout:</span>
                      <span className="font-medium">
                        {formatDate(productData.dateAdded)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <a 
                        href={productData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                      >
                        Voir sur TPT
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Informations du magasin
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom du magasin:</span>
                      <span className="font-medium">{productData.storeName}</span>
                    </div>
                    {productData.storeUrl && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Magasin:</span>
                        <a 
                          href={productData.storeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Visiter le magasin
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {productData.tags && productData.tags.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Tags/Mots-clés</h3>
                    <div className="flex flex-wrap gap-2">
                      {productData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 