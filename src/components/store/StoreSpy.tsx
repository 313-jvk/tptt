import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
    Search, 
    Store, 
    TrendingUp, 
    Package,
    Star,
    DollarSign,
    ExternalLink,
    Bookmark,
    CalendarPlus
} from 'lucide-react';

interface Product {
    title: string;
    url: string; // <-- AJOUT DE L'URL
    price: number;
    ratingsCount: number;
    estimatedSales: number;
    estimatedRevenue: number;
}

interface StoreData {
    storeName: string;
    about: string | null;
    averageRating: number | null;
    totalProducts: number | null;
    products: Product[];
    totalEstimatedSales: number;
    monthlyEstimatedRevenue: number;
    topProducts: Product[];
    topKeywords: Array<{ word: string; count: number }>;
    newProducts: Product[]; // <-- AJOUT DES NOUVEAUX PRODUITS
}

export const StoreSpy: React.FC = () => {
    const [storeUrl, setStoreUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [storeData, setStoreData] = useState<StoreData | null>(null);
    const { toast } = useToast();

    const analyzeStore = async () => {
        if (!storeUrl.includes('teacherspayteachers.com/store')) {
            toast({
                title: "URL invalide",
                description: "Veuillez entrer une URL valide de magasin Teachers Pay Teachers",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setStoreData(null);

        try {
            const response = await fetch('http://localhost:3000/api/analyze-store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: storeUrl }),
            });

            if (!response.ok) {
                throw new Error("Erreur de l'API: " + response.statusText);
            }

            const data: StoreData = await response.json();
            setStoreData(data);
            
            toast({
                title: "Analyse terminée",
                description: "Les données du magasin ont été analysées avec succès",
            });

        } catch (error) {
            console.error('Erreur lors de l\'analyse du magasin:', error);
            toast({
                title: "Erreur d'analyse",
                description: "Échec de la récupération des données du magasin.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const saveStore = () => {
        toast({
            title: "Magasin sauvegardé",
            description: "Ce magasin a été ajouté à votre surveillance",
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Espion de Magasin TPT
                </h1>
                <p className="text-muted-foreground mt-2">
                    Analysez les performances et stratégies des magasins Teachers Pay Teachers
                </p>
            </div>

            <Card className="shadow-medium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Analyser un magasin
                    </CardTitle>
                    <CardDescription>
                        Entrez l'URL du magasin TPT que vous souhaitez analyser
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="store-url">URL du magasin TPT</Label>
                        <Input
                            id="store-url"
                            placeholder="https://www.teacherspayteachers.com/Store/..."
                            value={storeUrl}
                            onChange={(e) => setStoreUrl(e.target.value)}
                            className="transition-smooth focus:shadow-soft"
                        />
                    </div>
                    <Button 
                        onClick={analyzeStore} 
                        disabled={!storeUrl || loading}
                        className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                    >
                        {loading ? (
                            <>
                                <Search className="mr-2 h-4 w-4 animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <Store className="mr-2 h-4 w-4" />
                                Analyser le magasin
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {storeData && (
                <div className="space-y-6">
                    <Card className="shadow-medium">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Store className="h-6 w-6" />
                                        {storeData.storeName}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Analyse détaillée des performances du magasin
                                    </CardDescription>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={saveStore}
                                    className="ml-4"
                                >
                                    <Bookmark className="mr-2 h-4 w-4" />
                                    Surveiller
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <Card className="p-4 border-primary/20 bg-primary-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="h-4 w-4" />
                                            Produits totaux
                                        </div>
                                        <div className="text-2xl font-bold text-primary">
                                            {storeData.totalProducts}
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card className="p-4 border-secondary/20 bg-secondary-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4" />
                                            Note moyenne
                                        </div>
                                        <div className="text-2xl font-bold text-secondary">
                                            {storeData.averageRating}/5
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card className="p-4 border-accent/20 bg-accent-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <TrendingUp className="h-4 w-4" />
                                            Ventes totales
                                        </div>
                                        <div className="text-2xl font-bold text-accent">
                                            {storeData.totalEstimatedSales.toLocaleString()}
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card className="p-4 border-secondary/20 bg-secondary-muted/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            Revenus mensuels
                                        </div>
                                        <div className="text-2xl font-bold text-secondary">
                                            ${storeData.monthlyEstimatedRevenue.toLocaleString()}
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="p-4">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Produits les plus performants
                                    </h3>
                                    <div className="space-y-3">
                                        {storeData.topProducts.map((product, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{product.title}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            ${product.price}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {product.ratingsCount} évaluations
                                                        </span>
                                                        {product.url && (
                                                            <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                Lien <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="secondary">
                                                    {product.estimatedSales} ventes
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                
                                <Card className="p-4">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Mots-clés principaux
                                    </h3>
                                    <div className="space-y-2">
                                        {storeData.topKeywords.map((keyword, index) => (
                                            <div 
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-accent/20 transition-colors"
                                            >
                                                <span className="text-sm">{keyword.word}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {keyword.count} fois
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                
                                {/* NOUVELLE CARTE POUR LES PRODUITS RÉCENTS */}
                                {storeData.newProducts && storeData.newProducts.length > 0 && (
                                    <Card className="p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <CalendarPlus className="h-4 w-4" />
                                            Nouveaux produits
                                        </h3>
                                        <div className="space-y-3">
                                            {storeData.newProducts.map((product, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{product.title}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-muted-foreground">
                                                                ${product.price}
                                                            </span>
                                                            <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                Lien <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t flex items-center justify-end">
                                <a 
                                    href={storeUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                >
                                    Visiter le magasin sur TPT
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};