import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { analyzeTPTProduct } from '@/api/tptScraper.ts';
import { 
  Search, 
  Star, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Calendar,
  ExternalLink,
  Bookmark,
  Store
} from 'lucide-react';

interface ProductData {
  title: string;
  description: string;
  price: number | null; // Peut être null
  ratingsCount: number | null; // Peut être null
  averageRating: number | null; // Peut être null
  storeName: string;
  storeUrl: string;
  pageCount?: number | null; // Peut être null
  dateAdded?: string | null; // Peut être null
  estimatedSales: number | null; // Peut être null
  estimatedProfit: number | null; // Peut être null
  url: string; 
}

export const ProductAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const { toast } = useToast();

 const analyzeProduct = async () => {
  if (!url.includes('teacherspayteachers.com/Product/')) {
    toast({
      title: "URL invalide",
      description: "Veuillez entrer une URL de produit TPT valide.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);

  try {
    const data = await analyzeTPTProduct(url);

    if (!data) {
      throw new Error("Aucune donnée reçue du serveur");
    }

    setProductData({ ...data, url });

    toast({
      title: "Analyse terminée",
      description: "Les données du produit ont été analysées avec succès",
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erreur d'analyse du produit:", error);
    toast({
      title: "Erreur",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};



  const saveProduct = () => {
    toast({
      title: "Produit sauvegardé",
      description: "Ce produit a été ajouté à vos recherches sauvegardées",
    });
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
            />
          </div>
          <Button 
            onClick={analyzeProduct} 
            disabled={!url || loading}
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
                Analyser le produit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

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
                    {productData.price ? `$${productData.price.toLocaleString('en-US')}` : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    Évaluations
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{productData.ratingsCount ? productData.ratingsCount : 'N/A'}</span>
                    <Badge variant="secondary">
                      {productData.averageRating ? `${productData.averageRating}/5` : 'N/A'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Ventes estimées
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {productData.estimatedSales ? productData.estimatedSales.toLocaleString('en-US') : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Profit estimé
                  </div>
                  <div className="text-2xl font-bold text-secondary">
                    {productData.estimatedProfit ? `$${productData.estimatedProfit.toLocaleString('en-US')}` : 'N/A'}
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
                    {/* FIX: Vérifie si le nombre de pages existe avant de l'afficher */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre de pages:</span>
                      <span className="font-medium">{productData.pageCount ? productData.pageCount : 'N/A'}</span>
                    </div>
                    {/* FIX: Vérifie si la date existe avant de l'afficher */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date d'ajout:</span>
                      <span className="font-medium">{productData.dateAdded ? new Date(productData.dateAdded).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <a 
                        href={productData.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Voir sur TPT
                        <ExternalLink className="h-3 w-3" />
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
