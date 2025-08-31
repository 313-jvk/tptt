import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuration PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

// Base de données temporaire en mémoire (remplacez par une vraie DB)
const subscriptions = new Map();
const userSubscriptions = new Map(); // userId -> subscription data

// ============================================
// FONCTION SCRAPING PRODUITS CORRIGÉE
// ============================================

// Fonction de scraping simplifiée et plus robuste
const scrapeProductDataFallback = async (url) => {
    try {
        console.log(`[${new Date().toISOString()}] Fallback: Récupération HTTP de ${url}`);
        
        // Faire une requête HTTP simple
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 15000,
            maxRedirects: 5
        });
        
        const html = response.data;
        console.log(`[${new Date().toISOString()}] HTML reçu, taille: ${html.length} caractères`);
        
        // Charger le HTML avec Cheerio (comme jQuery côté serveur)
        const $ = cheerio.load(html);
        
        const data = {};

        // 1. TITRE - Plusieurs méthodes
        console.log('Extraction titre...');
        
        // Méthode 1: Balise title
        let title = $('title').text().trim();
        
        // Méthode 2: Premier h1 qui semble être un titre de produit
        if (!title || title.includes('Teachers Pay Teachers')) {
            $('h1').each((i, el) => {
                const h1Text = $(el).text().trim();
                if (h1Text && h1Text.length > 10 && !h1Text.includes('Teachers Pay Teachers')) {
                    title = h1Text;
                    return false; // break
                }
            });
        }
        
        // Méthode 3: Meta property og:title
        if (!title) {
            title = $('meta[property="og:title"]').attr('content');
        }
        
        data.title = title || 'Produit TPT';
        console.log('Titre trouvé:', data.title);

        // 2. PRIX - Recherche de patterns
        console.log('Extraction prix...');
        
        let price = null;
        
        // Méthode 1: Chercher dans le texte complet
        const fullText = $.html();
        const priceMatches = fullText.match(/\$\s*(\d+(?:\.\d{2})?)/g);
        
        if (priceMatches) {
            for (const match of priceMatches) {
                const priceValue = parseFloat(match.replace('$', '').trim());
                if (priceValue > 0 && priceValue < 500) { // Prix raisonnable
                    price = priceValue;
                    break;
                }
            }
        }
        
        // Méthode 2: Sélecteurs spécifiques (si la structure est connue)
        if (!price) {
            const priceElements = [
                '[class*="price"]',
                '[data-price]',
                '.product-price',
                'span:contains("$")'
            ];
            
            for (const selector of priceElements) {
                const element = $(selector).first();
                if (element.length) {
                    const priceText = element.text();
                    const priceMatch = priceText.match(/\$\s*(\d+(?:\.\d{2})?)/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[1]);
                        break;
                    }
                }
            }
        }
        
        data.price = price;
        console.log('Prix trouvé:', data.price);

        // 3. ÉVALUATIONS - Recherche de patterns numériques
        console.log('Extraction évaluations...');
        
        let ratingsCount = null;
        const textContent = $.text();
        
        const ratingPatterns = [
            /(\d+)\s*ratings?/i,
            /(\d+)\s*reviews?/i,
            /(\d+)\s*évaluations?/i,
            /ratings?\s*[:\-]\s*(\d+)/i
        ];
        
        for (const pattern of ratingPatterns) {
            const match = textContent.match(pattern);
            if (match && match[1]) {
                const count = parseInt(match[1], 10);
                if (count > 0 && count < 50000) {
                    ratingsCount = count;
                    break;
                }
            }
        }
        
        data.ratingsCount = ratingsCount;
        console.log('Évaluations trouvées:', data.ratingsCount);

        // 4. NOTE MOYENNE
        console.log('Extraction note moyenne...');
        
        let averageRating = null;
        const avgPatterns = [
            /(\d\.?\d?)\s*out\s*of\s*5/i,
            /(\d\.?\d?)\s*\/\s*5/i,
            /(\d\.?\d?)\s*stars?/i
        ];
        
        for (const pattern of avgPatterns) {
            const match = textContent.match(pattern);
            if (match && match[1]) {
                const rating = parseFloat(match[1]);
                if (rating > 0 && rating <= 5) {
                    averageRating = rating;
                    break;
                }
            }
        }
        
        data.averageRating = averageRating;
        console.log('Note moyenne trouvée:', data.averageRating);

        // 5. NOM DU MAGASIN
        console.log('Extraction magasin...');
        
        let storeName = null;
        let storeUrl = null;
        
        // Chercher les liens vers /store/ ou /Store/
        $('a[href*="/store/"], a[href*="/Store/"]').each((i, el) => {
            const linkText = $(el).text().trim();
            if (linkText && linkText.length > 2 && linkText.length < 100) {
                storeName = linkText;
                storeUrl = $(el).attr('href');
                return false; // break
            }
        });
        
        data.storeName = storeName || 'Magasin non identifié';
        data.storeUrl = storeUrl;
        console.log('Magasin trouvé:', data.storeName);

        // 6. DESCRIPTION
        console.log('Extraction description...');
        
        let description = null;
        
        // Méthode 1: Meta description
        description = $('meta[name="description"]').attr('content');
        
        // Méthode 2: Meta property og:description
        if (!description) {
            description = $('meta[property="og:description"]').attr('content');
        }
        
        // Méthode 3: Premier paragraphe long
        if (!description) {
            $('p').each((i, el) => {
                const pText = $(el).text().trim();
                if (pText && pText.length > 50 && pText.length < 500) {
                    description = pText;
                    return false; // break
                }
            });
        }
        
        data.description = description || 'Description non disponible';

        // 7. TAGS/MOTS-CLÉS
        console.log('Extraction tags...');
        
        const tags = [];
        
        // Méthode 1: Meta keywords
        const metaKeywords = $('meta[name="keywords"]').attr('content');
        if (metaKeywords) {
            tags.push(...metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 1));
        }
        
        // Méthode 2: Chercher dans certaines classes ou structures
        $('[class*="tag"], [class*="keyword"], .category').each((i, el) => {
            const tagText = $(el).text().trim();
            if (tagText && tagText.length > 1 && tagText.length < 50) {
                tags.push(tagText);
            }
        });
        
        data.tags = tags.slice(0, 20); // Limiter à 20 tags

        // 8. CALCULS ESTIMÉS
        console.log('Calcul estimations...');
        
        const salesFactor = 10;
        if (data.ratingsCount && data.ratingsCount > 0) {
            data.estimatedSales = data.ratingsCount * salesFactor;
            
            if (data.price && data.price > 0) {
                data.estimatedProfit = Math.round(data.price * data.estimatedSales * 100) / 100;
            }
        }

        // 9. INFORMATIONS SUPPLÉMENTAIRES
        data.pageDetails = null; // Difficile à extraire sans JavaScript
        data.dateAdded = null; // Difficile à extraire sans structure précise

        console.log(`[${new Date().toISOString()}] Fallback terminé:`, {
            titre: !!data.title,
            prix: !!data.price,
            evaluations: !!data.ratingsCount
        });

        return data;

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erreur fallback:`, error.message);
        
        if (error.code === 'ENOTFOUND') {
            throw new Error('URL inaccessible ou connexion internet problématique');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('Timeout: La page TPT met trop de temps à répondre');
        } else if (error.response && error.response.status === 403) {
            throw new Error('Accès refusé par TPT. Réessayez plus tard.');
        } else if (error.response && error.response.status === 404) {
            throw new Error('Produit non trouvé. Vérifiez l\'URL.');
        } else {
            throw new Error(`Erreur lors de la récupération: ${error.message}`);
        }
    }
};

// Fonction principale qui essaie Puppeteer puis fallback
const scrapeProductDataWithFallback = async (url) => {
    try {
        // Essayer d'abord avec Puppeteer (votre fonction existante)
        console.log('Tentative avec Puppeteer...');
        return await scrapeProductData(url);
        
    } catch (puppeteerError) {
        console.log(`Puppeteer échoué: ${puppeteerError.message}`);
        console.log('Tentative avec méthode fallback...');
        
        try {
            const fallbackData = await scrapeProductDataFallback(url);
            
            // Ajouter une note indiquant que c'est un fallback
            fallbackData.extractionMethod = 'fallback';
            fallbackData.note = 'Données extraites avec méthode simplifiée - certaines informations peuvent être limitées';
            
            return fallbackData;
            
        } catch (fallbackError) {
            console.log(`Fallback aussi échoué: ${fallbackError.message}`);
            throw new Error(`Impossible d'analyser le produit avec les deux méthodes. Puppeteer: ${puppeteerError.message}. Fallback: ${fallbackError.message}`);
        }
    }
}; 

// ============================================
// ENDPOINTS PRODUITS AVEC GESTION D'ERREURS AMÉLIORÉE
// ============================================

// Endpoint de test pour vérifier le statut du scraping
app.get('/api/scraper/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        puppeteer: 'ready',
        environment: process.env.NODE_ENV || 'development',
        memory: process.memoryUsage()
    });
});

// Endpoint de test simple
app.post('/api/test-product', async (req, res) => {
    try {
        res.json({
            message: 'Test endpoint fonctionnel',
            receivedUrl: req.body.url || 'Aucune URL',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            puppeteerAvailable: !!puppeteer
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Endpoint principal pour analyser un produit
// Remplacer votre endpoint /api/analyze-product par cette version :

app.post('/api/analyze-product', async (req, res) => {
    const startTime = Date.now();
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ 
            success: false,
            message: 'URL produit requise.' 
        });
    }

    // Validation de l'URL TPT
    const validPatterns = [
        'teacherspayteachers.com/Product/',
        'tpt.com/Product/'
    ];
    
    const isValidUrl = validPatterns.some(pattern => url.includes(pattern));
    
    if (!isValidUrl) {
        return res.status(400).json({ 
            success: false,
            message: 'URL de produit TPT invalide. Veuillez utiliser une URL complète de produit contenant "/Product/".' 
        });
    }

    try {
        console.log(`[${new Date().toISOString()}] 🚀 Analyse produit démarrée: ${url}`);
        
        // Utiliser la fonction avec fallback
        const data = await scrapeProductDataWithFallback(url);
        
        const processingTime = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ✅ Analyse produit terminée en ${processingTime}ms`);
        
        res.status(200).json({
            success: true,
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString(),
            ...data
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] ❌ Erreur analyse produit (${processingTime}ms):`, error.message);
        
        // Différents codes d'erreur selon le type d'erreur
        let statusCode = 500;
        if (error.message.includes('timeout')) {
            statusCode = 408; // Request Timeout
        } else if (error.message.includes('invalide') || error.message.includes('URL')) {
            statusCode = 400; // Bad Request
        } else if (error.message.includes('réseau') || error.message.includes('network')) {
            statusCode = 503; // Service Unavailable
        }
        
        res.status(statusCode).json({ 
            success: false,
            message: error.message,
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString(),
            errorType: error.name || 'ScrapingError'
        });
    }
});

app.post('/api/test-fallback', async (req, res) => {
    const { url } = req.body;
    
    try {
        console.log('Test de la méthode fallback uniquement...');
        const data = await scrapeProductDataFallback(url);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}); 


// Endpoint de diagnostic pour comprendre ce qui ne va pas
app.post('/api/diagnose-page', async (req, res) => {
    let browser;
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL requise' });
    }
    
    try {
        console.log('🔍 Diagnostic démarré pour:', url);
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });

        // Prendre une capture d'écran pour voir ce qui se charge
        const screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: false,
            clip: { x: 0, y: 0, width: 1280, height: 800 }
        });

        const diagnostics = await page.evaluate(() => {
            return {
                // Informations de base
                title: document.title,
                url: window.location.href,
                
                // Vérifier si c'est bien TPT
                isTptDomain: window.location.hostname.includes('teacherspayteachers'),
                
                // Compter les éléments
                totalElements: document.querySelectorAll('*').length,
                h1Count: document.querySelectorAll('h1').length,
                h1Texts: Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent.trim()),
                
                // Chercher des éléments de prix
                elementsWithDollar: Array.from(document.querySelectorAll('*')).filter(el => 
                    el.textContent && el.textContent.includes('$')
                ).length,
                
                // Chercher des éléments avec "rating"
                elementsWithRating: Array.from(document.querySelectorAll('*')).filter(el => 
                    el.textContent && el.textContent.toLowerCase().includes('rating')
                ).length,
                
                // Liens vers des stores
                storeLinks: Array.from(document.querySelectorAll('a[href*="/store/"], a[href*="/Store/"]'))
                    .map(a => ({
                        text: a.textContent.trim(),
                        href: a.href
                    })).slice(0, 5),
                
                // Métadonnées
                metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content'),
                
                // Vérifier s'il y a des erreurs JavaScript
                hasErrors: window.jsErrors ? window.jsErrors.length > 0 : false,
                
                // Échantillon du contenu textuel
                bodyTextSample: document.body.textContent.substring(0, 1000),
                
                // Vérifier la structure de la page
                hasProductStructure: {
                    hasTitle: document.querySelectorAll('h1').length > 0,
                    hasPrice: document.body.textContent.includes('$'),
                    hasRatings: document.body.textContent.toLowerCase().includes('rating') ||
                               document.body.textContent.toLowerCase().includes('review'),
                    hasStore: document.querySelectorAll('a[href*="/store/"]').length > 0
                }
            };
        });

        res.json({
            success: true,
            diagnostics,
            screenshot: `data:image/png;base64,${screenshot}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur diagnostic:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}); 

// ============================================
// FONCTIONS PAYPAL (VOTRE CODE EXISTANT)
// ============================================

// Fonction pour obtenir un token d'accès PayPal
const getPayPalAccessToken = async () => {
    try {
        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v1/oauth2/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'en_US',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_CLIENT_SECRET
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Erreur obtention token PayPal:', error.response?.data || error.message);
        throw new Error('Impossible d\'obtenir le token PayPal');
    }
};

// Créer un abonnement PayPal avec support des cartes de crédit
app.post('/api/paypal/create-subscription', async (req, res) => {
    try {
        const { planId, userId, planName } = req.body;

        if (!planId || !userId) {
            return res.status(400).json({ error: 'planId et userId sont requis' });
        }

        // Vérifier si le plan est configuré
        if (planId.includes('NOT-CONFIGURED') || planId.includes('XXXXX') || planId.includes('YYYYY')) {
            return res.status(400).json({ 
                error: 'Plan non configuré',
                message: 'Ce plan PayPal n\'est pas encore configuré. Veuillez contacter l\'administrateur.'
            });
        }

        const accessToken = await getPayPalAccessToken();

        const subscriptionData = {
            plan_id: planId,
            start_time: new Date(Date.now() + 60000).toISOString(), // Démarre dans 1 minute
            subscriber: {
                name: {
                    given_name: "Utilisateur",
                    surname: "TPT"
                }
            },
            application_context: {
                brand_name: "TPT Niche Navigator",
                locale: "fr-FR",
                shipping_preference: "NO_SHIPPING",
                user_action: "SUBSCRIBE_NOW",
                payment_method: {
                    payer_selected: "PAYPAL",
                    payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
                },
                // Configuration pour accepter les cartes de crédit/débit
                payment_types: [
                    "PAYPAL",
                    "CARD"  // Permet les paiements par carte
                ],
                // Configuration des cartes acceptées
                card_types: [
                    "VISA",
                    "MASTERCARD", 
                    "AMEX",
                    "DISCOVER"
                ],
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/success`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/cancel`
            }
        };

        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
            subscriptionData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'PayPal-Request-Id': `TPT-${userId}-${Date.now()}`,
                    'Prefer': 'return=representation'
                }
            }
        );

        const subscription = response.data;
        
        // Stocker les informations de l'abonnement
        subscriptions.set(subscription.id, {
            id: subscription.id,
            userId,
            planId,
            planName,
            status: subscription.status,
            createdAt: new Date().toISOString()
        });

        // Trouver l'URL d'approbation
        const approvalUrl = subscription.links.find(link => link.rel === 'approve')?.href;

        if (!approvalUrl) {
            throw new Error('URL d\'approbation non trouvée');
        }

        res.status(200).json({
            subscriptionId: subscription.id,
            approvalUrl: approvalUrl,
            status: subscription.status,
            message: 'Redirection vers PayPal - Vous pourrez payer par PayPal ou carte bancaire'
        });

    } catch (error) {
        console.error('Erreur création abonnement:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de la création de l\'abonnement',
            details: error.response?.data || error.message
        });
    }
});

// Approuver un abonnement après retour de PayPal
app.post('/api/paypal/approve-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId requis' });
        }

        const accessToken = await getPayPalAccessToken();

        // Récupérer les détails de l'abonnement
        const response = await axios.get(
            `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        const subscription = response.data;
        
        // Mettre à jour les informations de l'abonnement
        const storedSub = subscriptions.get(subscriptionId);
        if (storedSub) {
            storedSub.status = subscription.status;
            storedSub.approvedAt = new Date().toISOString();
            
            // Activer l'abonnement pour l'utilisateur
            userSubscriptions.set(storedSub.userId, {
                subscriptionId: subscriptionId,
                planId: storedSub.planId,
                planName: storedSub.planName,
                status: subscription.status,
                isActive: subscription.status === 'ACTIVE',
                startDate: subscription.start_time,
                nextBillingTime: subscription.billing_info?.next_billing_time
            });
        }

        res.status(200).json({
            success: true,
            subscription: subscription,
            message: 'Abonnement activé avec succès'
        });

    } catch (error) {
        console.error('Erreur approbation abonnement:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'approbation de l\'abonnement',
            details: error.response?.data || error.message
        });
    }
});

// Annuler un abonnement
app.post('/api/paypal/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId, reason } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({ error: 'subscriptionId requis' });
        }

        const accessToken = await getPayPalAccessToken();

        const cancelData = {
            reason: reason || 'Annulation demandée par l\'utilisateur'
        };

        await axios.post(
            `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
            cancelData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Mettre à jour le statut dans notre base de données
        const storedSub = subscriptions.get(subscriptionId);
        if (storedSub) {
            storedSub.status = 'CANCELLED';
            storedSub.cancelledAt = new Date().toISOString();
            
            // Désactiver pour l'utilisateur
            const userSub = userSubscriptions.get(storedSub.userId);
            if (userSub) {
                userSub.status = 'CANCELLED';
                userSub.isActive = false;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Abonnement annulé avec succès'
        });

    } catch (error) {
        console.error('Erreur annulation abonnement:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'annulation de l\'abonnement',
            details: error.response?.data || error.message
        });
    }
});

// Vérifier le statut d'abonnement d'un utilisateur
app.get('/api/user/:userId/subscription', (req, res) => {
    const { userId } = req.params;
    
    const userSub = userSubscriptions.get(userId);
    
    if (!userSub) {
        return res.status(200).json({
            hasSubscription: false,
            plan: 'free'
        });
    }
    
    res.status(200).json({
        hasSubscription: true,
        subscription: userSub
    });
});

// Endpoint pour vérifier la configuration PayPal
app.get('/api/paypal/config-status', (req, res) => {
    const isConfigured = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
    
    res.json({
        configured: isConfigured,
        environment: process.env.NODE_ENV || 'development',
        clientId: PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 10) + '...' : 'Non configuré'
    });
});

// Endpoints pour les pages de retour PayPal
app.get('/subscription/success', (req, res) => {
    const { subscription_id, ba_token } = req.query;
    
    // Rediriger vers le frontend avec les paramètres
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/subscription/success?subscription_id=${subscription_id}&ba_token=${ba_token}`);
});

app.get('/subscription/cancel', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/subscription/cancel`);
});

// Webhook PayPal pour les événements d'abonnement
app.post('/api/paypal/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        const event = JSON.parse(req.body.toString());
        
        console.log('Événement PayPal reçu:', event.event_type);
        
        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                // Abonnement activé
                console.log('Abonnement activé:', event.resource.id);
                const activatedSub = subscriptions.get(event.resource.id);
                if (activatedSub) {
                    userSubscriptions.set(activatedSub.userId, {
                        subscriptionId: event.resource.id,
                        planId: activatedSub.planId,
                        planName: activatedSub.planName,
                        status: 'ACTIVE',
                        isActive: true,
                        startDate: event.resource.start_time,
                        nextBillingTime: event.resource.billing_info?.next_billing_time
                    });
                }
                break;
                
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                // Abonnement annulé
                console.log('Abonnement annulé:', event.resource.id);
                const cancelledSub = subscriptions.get(event.resource.id);
                if (cancelledSub) {
                    const userSub = userSubscriptions.get(cancelledSub.userId);
                    if (userSub) {
                        userSub.status = 'CANCELLED';
                        userSub.isActive = false;
                    }
                }
                break;
                
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                // Abonnement suspendu
                console.log('Abonnement suspendu:', event.resource.id);
                const suspendedSub = subscriptions.get(event.resource.id);
                if (suspendedSub) {
                    const userSub = userSubscriptions.get(suspendedSub.userId);
                    if (userSub) {
                        userSub.status = 'SUSPENDED';
                        userSub.isActive = false;
                    }
                }
                break;
                
            case 'PAYMENT.SALE.COMPLETED':
                // Paiement réussi
                console.log('Paiement réussi:', event.resource.id);
                break;
                
            default:
                console.log('Événement non géré:', event.event_type);
        }
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Erreur webhook:', error);
        res.status(400).json({ error: 'Webhook invalide' });
    }
});

// ============================================
// AUTRES FONCTIONS DE SCRAPING (VOTRE CODE EXISTANT)
// ============================================

// Pour scraper les données de mots-clés
const scrapeKeywordData = async (keyword) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `https://www.teacherspayteachers.com/Browse/Search:${encodedKeyword}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForSelector('.SearchResultsHeader__headingWithCount', { timeout: 15000 }).catch(() => {
            console.log('Timeout: Élément principal de la page non trouvé.');
            throw new Error('Impossible de charger la page de résultats. Le sélecteur principal est manquant.');
        });

        const data = await page.evaluate(() => {
            const result = {};

            // Récupérer le nombre total de produits
            const totalProductsEl = document.querySelector('.SearchResultsHeader__headingWithCount div');
            if (totalProductsEl) {
                const match = totalProductsEl.textContent.match(/\d[\d,.]*/);
                if (match) {
                    result.totalProducts = parseInt(match[0].replace(/[,.]/g, ''), 10);
                } else {
                    result.totalProducts = 0;
                }
            } else {
                result.totalProducts = 0;
            }

            // Récupérer tous les produits avec leurs détails
            const productCards = document.querySelectorAll('[id^="product-row-"]');
            const products = [];
            const keywordCounts = {};

            productCards.forEach(card => {
                // Récupérer les informations du produit
                const titleElement = card.querySelector('h2 a[href*="/Product/"]');
                const title = titleElement ? titleElement.textContent.trim() : 'Titre non disponible';
                const productUrl = titleElement ? titleElement.href : null;

                // Prix
                const priceText = card.querySelector('[class*="ProductPrice-module__price--"]')?.textContent.trim() || null;
                const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;

                // Nombre d'évaluations
                const ratingCountText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"]')?.textContent.trim() || "0";
                const ratingsCount = parseInt(ratingCountText.replace(/[^0-9]/g, ''), 10) || 0;

                // Note moyenne
                const ratingValueText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"] > div')?.textContent.trim() || "0";
                const averageRating = parseFloat(ratingValueText) || 0;

                // Nom du vendeur/magasin
                const storeElement = card.querySelector('a[href*="/store/"]');
                const storeName = storeElement ? storeElement.textContent.trim() : 'Magasin non disponible';
                const storeUrl = storeElement ? storeElement.href : null;

                // Tags pour les mots-clés suggérés
                const tags = [];
                const productMetadataSection = card.querySelector('div[class*="ProductRowCard-module__cardMetadata--"] section');
                if (productMetadataSection) {
                    const rows = productMetadataSection.querySelectorAll('div[class*="MetadataFacetSection__row"]');
                    rows.forEach(row => {
                        const gradeText = row.querySelector('div:first-child')?.textContent.trim() || '';
                        if (gradeText.includes('th') || gradeText.includes('nd') || gradeText.includes('st')) {
                            const tagsText = row.querySelector('div:last-child')?.textContent.trim();
                            if (tagsText) {
                                tagsText.split(',').forEach(tag => {
                                    const trimmedTag = tag.trim();
                                    if (trimmedTag) {
                                        tags.push(trimmedTag);
                                    }
                                });
                            }
                        }
                    });
                }

                // Ajouter le produit à la liste
                products.push({
                    title,
                    url: productUrl,
                    price,
                    ratingsCount,
                    averageRating,
                    storeName,
                    storeUrl,
                    estimatedSales: ratingsCount * 10, // Votre facteur de multiplication
                    estimatedRevenue: price * ratingsCount * 10
                });

                // Compter les mots-clés pour les suggestions
                tags.forEach(tag => {
                    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
                    if (cleanTag.length > 2) {
                        keywordCounts[cleanTag] = (keywordCounts[cleanTag] || 0) + 1;
                    }
                });
            });

            // Trier les produits par nombre d'évaluations (décroissant) et prendre le top 10
            result.topProducts = products
                .sort((a, b) => b.ratingsCount - a.ratingsCount)
                .slice(0, 10);

            // Mots-clés suggérés
            result.relatedKeywords = Object.entries(keywordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word, count]) => ({ word, count }));

            // Calculer les moyennes
            let totalRating = 0;
            let totalProductsWithRating = 0;
            let totalPrice = 0;
            let totalProductsWithPrice = 0;

            products.forEach(product => {
                if (product.averageRating > 0) {
                    totalRating += product.averageRating;
                    totalProductsWithRating++;
                }
                if (product.price > 0) {
                    totalPrice += product.price;
                    totalProductsWithPrice++;
                }
            });

            result.averageRating = totalProductsWithRating > 0 ? 
                parseFloat((totalRating / totalProductsWithRating).toFixed(1)) : 0;
            result.averagePrice = totalProductsWithPrice > 0 ? 
                parseFloat((totalPrice / totalProductsWithPrice).toFixed(2)) : 0;

            return result;
        });

        // Calcul du niveau de concurrence (votre logique existante)
        const totalProducts = data.totalProducts;
        let competitionLevel;
        let competitionScore;

        if (totalProducts < 10000) {
            competitionLevel = 'Faible';
            competitionScore = Math.round((totalProducts / 10000) * 25);
        } else if (totalProducts < 50000) {
            competitionLevel = 'Moyen';
            competitionScore = 25 + Math.round(((totalProducts - 10000) / 40000) * 30);
        } else if (totalProducts < 100000) {
            competitionLevel = 'Élevé';
            competitionScore = 55 + Math.round(((totalProducts - 50000) / 50000) * 20);
        } else {
            competitionLevel = 'Très Élevé';
            const scoreCalc = 75 + Math.round((totalProducts - 100000) / 1000);
            competitionScore = Math.min(100, scoreCalc);
        }
        
        return {
            totalProducts: data.totalProducts,
            averagePrice: data.averagePrice,
            averageRating: data.averageRating,
            competitionLevel,
            competitionScore,
            relatedKeywords: data.relatedKeywords,
            topProducts: data.topProducts
        };

    } catch (error) {
        console.error("Erreur mot-clé:", error.message);
        throw new Error("Échec récupération mot-clé.");
    } finally {
        if (browser) await browser.close();
    }
};

// Pour scraper les magasins
const scrapeStoreData = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const storeData = await page.evaluate(() => {
            const data = {};
            const storeNameEl = document.querySelector('h1[class*="StorePageHeader-module__storeName--"]') || null;
            data.storeName = storeNameEl ? storeNameEl.textContent.trim() : null;
            const aboutEl = document.querySelector('p[class*="StorePageHeader-module__contentAbout--"]') || null;
            data.about = aboutEl ? aboutEl.textContent.trim() : null;
            const evaluationEl = document.querySelector('div[class*="RatingsLabel-module__ratingsLabelContainer--"] > div') || null;
            data.averageRating = evaluationEl ? parseFloat(evaluationEl.textContent.trim()) : null;
            
            const searchInput = document.getElementById('searchResources');
            if (searchInput && searchInput.placeholder) {
                const match = searchInput.placeholder.match(/(\d+)/);
                data.totalProducts = match ? parseInt(match[1], 10) : 0;
            } else {
                data.totalProducts = 0;
            }
            return data;
        });

        await page.setViewport({ width: 1280, height: 800 });
        let previousHeight;
        while (true) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 2000));
            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) {
                break;
            }
        }

        const allProducts = await page.evaluate(() => {
            const products = [];
            const productCards = document.querySelectorAll('[id^="product-row-"]');

            productCards.forEach(card => {
                const titleElement = card.querySelector('h2 a[href*="/Product/"]');
                const title = titleElement ? titleElement.textContent.trim() : null;
                const productUrl = titleElement ? titleElement.href : null;

                const priceText = card.querySelector('[class*="ProductPrice-module__price--"]')?.textContent.trim() || null;
                const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;

                const ratingCountText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"]')?.textContent.trim() || "0";
                const ratingsCount = parseInt(ratingCountText.replace(/[^0-9]/g, ''), 10) || 0;
                
                const tagsElement = card.querySelector('[class*="MetadataFacetSection"] > div[class*="Text-module__detail"]');
                const tags = tagsElement ? tagsElement.textContent.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

                const newBadge = card.querySelector('[class*="ProductRowLayoutCard-module__newBadge--"]');
                const isNew = !!newBadge;

                const estimatedSales = ratingsCount * 10;
                const estimatedRevenue = price && estimatedSales ? price * estimatedSales : 0;

                products.push({
                    title,
                    url: productUrl,
                    price,
                    ratingsCount,
                    estimatedSales,
                    estimatedRevenue,
                    tags,
                    isNew,
                });
            });
            return products;
        });

        const totalProducts = storeData.totalProducts > 0 ? storeData.totalProducts : allProducts.length;
        const topProducts = [...allProducts].sort((a, b) => b.ratingsCount - a.ratingsCount).slice(0, 10);
        const newProducts = allProducts.filter(p => p.isNew).slice(0, 5);

        const keywordCounts = {};
        allProducts.forEach(p => {
            if (p.tags && p.tags.length > 0) {
                p.tags.forEach(tag => {
                    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
                    if (cleanTag.length > 2) {
                        keywordCounts[cleanTag] = (keywordCounts[cleanTag] || 0) + 1;
                    }
                });
            }
        });
        const topKeywords = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        const totalEstimatedSales = allProducts.reduce((sum, p) => sum + p.estimatedSales, 0);
        const totalEstimatedRevenue = allProducts.reduce((sum, p) => sum + p.estimatedRevenue, 0);
        const monthlyEstimatedRevenue = totalEstimatedRevenue / 12;

        return {
            storeName: storeData.storeName,
            about: storeData.about,
            averageRating: storeData.averageRating,
            totalProducts,
            products: allProducts,
            totalEstimatedSales,
            monthlyEstimatedRevenue,
            topProducts,
            topKeywords,
            newProducts,
        };

    } catch (error) {
        console.error("Erreur magasin:", error.message);
        throw new Error("Échec récupération magasin.");
    } finally {
        if (browser) await browser.close();
    }
};

// ============================================
// ENDPOINTS POUR MOTS-CLÉS ET MAGASINS
// ============================================

app.post('/api/analyze-keyword', async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ message: 'Mot-clé requis.' });
    try {
        const data = await scrapeKeywordData(keyword);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/analyze-store', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL magasin requise.' });
    try {
        const data = await scrapeStoreData(url);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============================================
// DASHBOARD ENDPOINTS (VOTRE CODE EXISTANT)
// ============================================

// Simuler une base de données en mémoire pour la démo
let keywordOpportunities = [
    {
        id: 1,
        keyword: 'phonics worksheets',
        total_products: 8500,
        average_price: 4.50,
        average_rating: 4.2,
        competition_level: 'Faible',
        competition_score: 25,
        opportunity_score: 85,
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        keyword: 'sight words activities',
        total_products: 6200,
        average_price: 2.90,
        average_rating: 4.3,
        competition_level: 'Faible',
        competition_score: 18,
        opportunity_score: 78,
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        keyword: 'math centers kindergarten',
        total_products: 12000,
        average_price: 5.20,
        average_rating: 4.4,
        competition_level: 'Moyen',
        competition_score: 45,
        opportunity_score: 72,
        updated_at: new Date().toISOString()
    }
];

let trendingProducts = [
    {
        id: 1,
        product_url: 'https://www.teacherspayteachers.com/Product/Math-Game-123',
        title: 'Interactive Math Centers for Kindergarten',
        price: 5.99,
        store_name: 'MathMagicStore',
        ratings_count: 145,
        average_rating: 4.8,
        growth_rate: 85.5,
        tags: ['math', 'kindergarten', 'centers'],
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        product_url: 'https://www.teacherspayteachers.com/Product/Reading-Bundle-456',
        title: 'Phonics Reading Bundle - Complete Set',
        price: 8.50,
        store_name: 'ReadingCornerShop',
        ratings_count: 89,
        average_rating: 4.6,
        growth_rate: 72.3,
        tags: ['phonics', 'reading', 'bundle'],
        updated_at: new Date().toISOString()
    }
];

let userAlertsStore = new Map();

// Endpoints dashboard
app.get('/api/dashboard/opportunities', async (req, res) => {
    try {
        const { userId } = req.query;
        const opportunities = keywordOpportunities
            .filter(opp => opp.opportunity_score > 60)
            .sort((a, b) => b.opportunity_score - a.opportunity_score);
        
        res.json({
            success: true,
            opportunities: opportunities.slice(0, 6),
            total: opportunities.length
        });
        
    } catch (error) {
        console.error('Erreur récupération opportunités:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des opportunités' 
        });
    }
});

app.get('/api/dashboard/trending', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const trending = trendingProducts
            .filter(product => product.growth_rate > 30)
            .sort((a, b) => b.growth_rate - a.growth_rate)
            .slice(0, parseInt(limit));
        
        res.json({
            success: true,
            trending,
            total: trending.length
        });
        
    } catch (error) {
        console.error('Erreur récupération tendances:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des tendances' 
        });
    }
});

// ============================================
// ENDPOINT PRINCIPAL ET DÉMARRAGE DU SERVEUR
// ============================================

app.get('/', (req, res) => {
    res.json({
        status: 'TPT Niche Navigator API - En ligne',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/scraper/health',
            testProduct: '/api/test-product',
            analyzeProduct: '/api/analyze-product',
            analyzeKeyword: '/api/analyze-keyword',
            analyzeStore: '/api/analyze-store'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur TPT Niche Navigator démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Puppeteer disponible: ${!!puppeteer}`);
}); 