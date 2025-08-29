import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import axios from 'axios'; // ⭐️ Correction: Missing import

import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ⭐️ Note: For the webhook, we need the raw body
app.post('/api/paypal/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    // ⭐️ Note: In a real app, you would verify the signature here
    // const signature = req.headers['paypal-transmission-sig'];
    // const certUrl = req.headers['paypal-cert-url'];
    // verifyWebhook(req.body, signature, certUrl);
    try {
        const event = JSON.parse(req.body.toString());
        
        console.log('Événement PayPal reçu:', event.event_type);
        
        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
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


// Configuration PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

// Base de données temporaire en mémoire
const subscriptions = new Map();
const userSubscriptions = new Map(); // userId -> subscription data

// ⭐️ Correction: Remplacement de localStorage par une Map en mémoire
const userDb = new Map();

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

        if (planId.includes('NOT-CONFIGURED') || planId.includes('XXXXX') || planId.includes('YYYYY')) {
            return res.status(400).json({ 
                error: 'Plan non configuré',
                message: 'Ce plan PayPal n\'est pas encore configuré. Veuillez contacter l\'administrateur.'
            });
        }

        const accessToken = await getPayPalAccessToken();

        const subscriptionData = {
            plan_id: planId,
            start_time: new Date(Date.now() + 60000).toISOString(),
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
                payment_types: [ "PAYPAL", "CARD" ],
                card_types: [ "VISA", "MASTERCARD", "AMEX", "DISCOVER" ],
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
        subscriptions.set(subscription.id, {
            id: subscription.id,
            userId,
            planId,
            planName,
            status: subscription.status,
            createdAt: new Date().toISOString()
        });

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
        const storedSub = subscriptions.get(subscriptionId);
        if (storedSub) {
            storedSub.status = subscription.status;
            storedSub.approvedAt = new Date().toISOString();
            
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

        const storedSub = subscriptions.get(subscriptionId);
        if (storedSub) {
            storedSub.status = 'CANCELLED';
            storedSub.cancelledAt = new Date().toISOString();
            
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

// Nouveau endpoint pour vérifier la configuration PayPal
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
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/subscription/success?subscription_id=${subscription_id}&ba_token=${ba_token}`);
});

app.get('/subscription/cancel', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/subscription/cancel`);
});

const checkUsageLimit = async (userId, feature) => {
    const userSub = userSubscriptions.get(userId);
    
    if (!userSub || userSub.planId === 'free' || !userSub.isActive) {
        const limits = {
            'product-analysis': 5,
            'keyword-search': 3,
            'store-analysis': 1
        };
        return { allowed: true, remaining: limits[feature] };
    }
    
    if (userSub.planId.includes('pro')) {
        const limits = {
            'product-analysis': 50,
            'keyword-search': 25,
            'store-analysis': 10
        };
        return { allowed: true, remaining: limits[feature] };
    }
    
    return { allowed: true, remaining: -1 };
};

const authAndLimitMiddleware = (feature) => {
    return async (req, res, next) => {
        const userId = req.headers['user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentification requise' });
        }
        
        const usage = await checkUsageLimit(userId, feature);
        
        if (!usage.allowed) {
            return res.status(403).json({ 
                error: 'Limite d\'utilisation atteinte',
                message: 'Veuillez upgrader votre plan pour continuer'
            });
        }
        
        req.userId = userId;
        req.usageRemaining = usage.remaining;
        next();
    };
};

// ============================================
// ENDPOINTS POUR LE DASHBOARD FONCTIONNEL
// ============================================

app.get('/api/dashboard/opportunities', async (req, res) => {
    try {
        const { userId } = req.query;
        
        const opportunities = await getDashboardOpportunities();
        
        let personalizedOpportunities = opportunities;
        if (userId) {
            personalizedOpportunities = await getPersonalizedOpportunities(userId, opportunities);
        }
        
        res.json({
            success: true,
            opportunities: personalizedOpportunities.slice(0, 6),
            total: personalizedOpportunities.length
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
        
        const trendingProducts = await getTrendingProducts(parseInt(limit));
        
        res.json({
            success: true,
            trending: trendingProducts,
            total: trendingProducts.length
        });
        
    } catch (error) {
        console.error('Erreur récupération tendances:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des tendances' 
        });
    }
});

app.get('/api/dashboard/alerts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;
        
        const alerts = await getUserAlerts(parseInt(userId), parseInt(limit));
        
        res.json({
            success: true,
            alerts,
            unreadCount: alerts.filter(alert => !alert.is_read).length
        });
        
    } catch (error) {
        console.error('Erreur récupération alertes:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des alertes' 
        });
    }
});

app.get('/api/dashboard/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const stats = await getUserDashboardStats(parseInt(userId));
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
});

app.post('/api/dashboard/scan-opportunities', async (req, res) => {
    try {
        const { keywords } = req.body;
        
        if (!keywords || !Array.isArray(keywords)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Liste de mots-clés requise' 
            });
        }
        
        const results = await scanKeywordsForOpportunities(keywords);
        
        res.json({
            success: true,
            scanned: results.length,
            opportunities: results.filter(r => r.success).length,
            errors: results.filter(r => !r.success).length
        });
        
    } catch (error) {
        console.error('Erreur scan opportunités:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors du scan des opportunités' 
        });
    }
});

app.patch('/api/dashboard/alerts/:alertId/read', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId } = req.body;
        
        await markAlertAsRead(parseInt(alertId), parseInt(userId));
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Erreur marquer alerte:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la mise à jour de l\'alerte' 
        });
    }
});

// ============================================
// FONCTIONS UTILITAIRES POUR LE DASHBOARD
// ============================================

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

async function getDashboardOpportunities() {
    return keywordOpportunities
        .filter(opp => opp.opportunity_score > 60)
        .sort((a, b) => b.opportunity_score - a.opportunity_score);
}

// ⭐️ Correction: Utilise une Map en mémoire au lieu de localStorage
async function getPersonalizedOpportunities(userId, opportunities) {
    if (!userDb.has(userId)) {
        userDb.set(userId, { userAnalyses: [], userKeywords: [], userStores: [] });
    }
    const userData = userDb.get(userId);
    const analyzedKeywords = userData.userKeywords.map(analysis => analysis.keyword?.toLowerCase());
    
    return opportunities.map(opp => ({
        ...opp,
        isPersonalized: analyzedKeywords.some(keyword => 
            opp.keyword.toLowerCase().includes(keyword) || 
            keyword.includes(opp.keyword.toLowerCase())
        )
    })).sort((a, b) => {
        if (a.isPersonalized && !b.isPersonalized) return -1;
        if (!a.isPersonalized && b.isPersonalized) return 1;
        return b.opportunity_score - a.opportunity_score;
    });
}

async function getTrendingProducts(limit = 5) {
    return trendingProducts
        .filter(product => product.growth_rate > 30)
        .sort((a, b) => b.growth_rate - a.growth_rate)
        .slice(0, limit);
}

async function getUserAlerts(userId, limit = 10) {
    if (!userAlertsStore.has(userId)) {
        const exampleAlerts = [
            {
                id: Date.now(),
                user_id: userId,
                alert_type: 'keyword_opportunity',
                title: 'Nouvelle opportunité détectée !',
                description: 'Le mot-clé "phonics worksheets" présente une faible concurrence avec un bon potentiel de prix.',
                data: { keyword: 'phonics worksheets', opportunity_score: 85 },
                is_read: false,
                created_at: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                user_id: userId,
                alert_type: 'trending_product',
                title: 'Produit en forte croissance',
                description: 'Un produit de math centers connaît une croissance de +85% cette semaine.',
                data: { product_title: 'Interactive Math Centers', growth_rate: 85.5 },
                is_read: false,
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        userAlertsStore.set(userId, exampleAlerts);
    }
    
    return userAlertsStore.get(userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
}

// ⭐️ Correction: Utilise une Map en mémoire au lieu de localStorage
async function getUserDashboardStats(userId) {
    if (!userDb.has(userId)) {
        userDb.set(userId, { userAnalyses: [], userKeywords: [], userStores: [] });
    }
    const userData = userDb.get(userId);
    const userAnalyses = userData.userAnalyses;
    const userKeywords = userData.userKeywords;
    const userStores = userData.userStores;
    
    const thisMonth = new Date().getMonth();
    const thisWeek = getWeekNumber(new Date());
    
    const monthlyAnalyses = userAnalyses.filter(analysis => {
        const analysisMonth = new Date(analysis.date).getMonth();
        return analysisMonth === thisMonth;
    });
    
    const weeklyKeywords = userKeywords.filter(keyword => {
        const keywordWeek = getWeekNumber(new Date(keyword.date));
        return keywordWeek === thisWeek;
    });
    
    const totalPotentialProfit = userAnalyses.reduce((total, analysis) => {
        return total + (analysis.estimatedProfit || 0);
    }, 0);
    
    const alerts = await getUserAlerts(userId, 100);
    const unreadAlerts = alerts.filter(alert => !alert.is_read).length;
    
    const trendingOpportunities = await getTrendingOpportunities(userId);
    
    return {
        productsAnalyzed: monthlyAnalyses.length,
        keywordsExplored: weeklyKeywords.length,
        storesTracked: userStores.length,
        potentialProfit: Math.round(totalPotentialProfit),
        newAlerts: unreadAlerts,
        trendingOpportunities: trendingOpportunities.length,
        trends: {
            products: calculateTrend(monthlyAnalyses.length, Math.max(0, monthlyAnalyses.length - 3)),
            keywords: Math.max(0, weeklyKeywords.length - 2),
            stores: Math.max(0, userStores.length - 1),
            profit: Math.round(((totalPotentialProfit - 5000) / 5000) * 100)
        }
    };
}

// ⭐️ Correction: Utilise une Map en mémoire au lieu de localStorage
async function getTrendingOpportunities(userId) {
    if (!userDb.has(userId)) {
        userDb.set(userId, { userAnalyses: [], userKeywords: [], userStores: [] });
    }
    const userData = userDb.get(userId);
    const userKeywords = userData.userKeywords;
    const analyzedKeywords = userKeywords.map(k => k.keyword?.toLowerCase());
    
    const opportunities = await getDashboardOpportunities();
    return opportunities.filter(opp => 
        opp.opportunity_score > 70 && 
        analyzedKeywords.some(keyword => 
            opp.keyword.toLowerCase().includes(keyword) || 
            keyword.includes(opp.keyword.toLowerCase())
        )
    );
}

async function scanKeywordsForOpportunities(keywords) {
    const results = [];
    
    for (const keyword of keywords) {
        try {
            const keywordData = await scrapeKeywordData(keyword);
            const opportunityScore = calculateOpportunityScore(keywordData);
            
            const opportunity = {
                id: Date.now() + Math.random(),
                keyword: keyword,
                total_products: keywordData.totalProducts,
                average_price: keywordData.averagePrice,
                average_rating: keywordData.averageRating,
                competition_level: keywordData.competitionLevel,
                competition_score: keywordData.competitionScore,
                opportunity_score: opportunityScore,
                updated_at: new Date().toISOString()
            };
            
            const existingIndex = keywordOpportunities.findIndex(opp => opp.keyword === keyword);
            if (existingIndex >= 0) {
                keywordOpportunities[existingIndex] = opportunity;
            } else {
                keywordOpportunities.push(opportunity);
            }
            
            results.push({ keyword, success: true, data: opportunity });
            
            if (opportunityScore > 70) {
                // ⭐️ Note: You must pass the userId to this function in a real app
                await createOpportunityAlert(keyword, opportunity, 1);
            }
        } catch (error) {
            console.error(`Erreur scan mot-clé ${keyword}:`, error);
            results.push({ keyword, success: false, error: error.message });
        }
    }
    
    return results;
}

function calculateOpportunityScore(keywordData) {
    let score = 0;
    
    switch (keywordData.competitionLevel) {
        case 'Faible': score += 40; break;
        case 'Moyen': score += 25; break;
        case 'Élevé': score += 10; break;
        default: score += 5;
    }
    
    if (keywordData.averagePrice > 5) { score += 25; } 
    else if (keywordData.averagePrice > 3) { score += 15; } 
    else if (keywordData.averagePrice > 1) { score += 10; }
    
    if (keywordData.averageRating > 4.0) { score += 15; } 
    else if (keywordData.averageRating > 3.5) { score += 10; }
    
    if (keywordData.totalProducts < 5000) { score += 20; } 
    else if (keywordData.totalProducts < 15000) { score += 15; } 
    else if (keywordData.totalProducts < 30000) { score += 5; }
    
    return Math.min(100, score);
}

// ⭐️ Correction: Add userId parameter
async function createOpportunityAlert(keyword, opportunity, userId) {
    const alertData = {
        id: Date.now() + Math.random(),
        alert_type: 'keyword_opportunity',
        title: `🎯 Opportunité détectée : "${keyword}"`,
        description: `Score d'opportunité: ${opportunity.opportunity_score}/100. Concurrence ${opportunity.competition_level.toLowerCase()}, prix moyen ${opportunity.average_price}.`,
        data: { keyword, opportunity_score: opportunity.opportunity_score, competition_level: opportunity.competition_level },
        is_read: false,
        created_at: new Date().toISOString()
    };
    
    // ⭐️ Correction: Use the provided userId instead of a hardcoded one
    if (!userAlertsStore.has(userId)) {
        userAlertsStore.set(userId, []);
    }
    userAlertsStore.get(userId).unshift(alertData);
}

async function markAlertAsRead(alertId, userId) {
    if (!userAlertsStore.has(userId)) return;
    
    const alerts = userAlertsStore.get(userId);
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
        alert.is_read = true;
    }
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateTrend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

// Tâche automatique pour scanner les opportunités
async function runOpportunityScanner() {
    console.log('🔍 Démarrage du scan automatique des opportunités...');
    
    const popularKeywords = [
        'phonics worksheets', 'math centers kindergarten', 'reading comprehension',
        'sight words activities', 'science experiments elementary', 'writing prompts',
        'spelling activities', 'fraction worksheets', 'alphabet activities',
        'social studies projects'
    ];
    
    try {
        const results = await scanKeywordsForOpportunities(popularKeywords);
        console.log(`✅ Scan terminé: ${results.filter(r => r.success).length} opportunités trouvées`);
        return results;
    } catch (error) {
        console.error('❌ Erreur lors du scan automatique:', error);
        return [];
    }
}

// Programmer le scan automatique toutes les 4 heures
setInterval(() => {
    runOpportunityScanner();
}, 4 * 60 * 60 * 1000);

app.post('/api/dashboard/manual-scan', async (req, res) => {
    try {
        console.log('🔄 Scan manuel déclenché...');
        const results = await runOpportunityScanner();
        
        res.json({
            success: true,
            message: 'Scan terminé avec succès',
            results: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        console.error('Erreur scan manuel:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors du scan manuel'
        });
    }
});

// ============================================
// ENDPOINTS POUR LES PRODUITS TENDANCE
// ============================================

async function updateTrendingProducts() {
    console.log('📈 Mise à jour des produits tendance...');
    
    const newTrendingProduct = {
        id: Date.now(),
        product_url: 'https://www.teacherspayteachers.com/Product/New-Science-Kit-' + Math.random(),
        title: 'STEM Activity Pack - Weather Science',
        price: 6.75,
        store_name: 'ScienceStarsTeacher',
        ratings_count: 34,
        average_rating: 4.7,
        growth_rate: 95.2,
        tags: ['science', 'STEM', 'weather', 'elementary'],
        updated_at: new Date().toISOString()
    };
    
    trendingProducts.unshift(newTrendingProduct);
    trendingProducts = trendingProducts.slice(0, 20);
    
    // ⭐️ Correction: Pass a userId to the alert creation function
    await createTrendingProductAlert(newTrendingProduct, 1);
    
    console.log('✅ Produits tendance mis à jour');
}

// ⭐️ Correction: Add userId parameter
async function createTrendingProductAlert(product, userId) {
    const alertData = {
        id: Date.now() + Math.random(),
        alert_type: 'trending_product',
        title: `🔥 Produit en forte croissance détecté !`,
        description: `"${product.title}" connaît une croissance de ${product.growth_rate}% avec ${product.ratings_count} évaluations récentes.`,
        data: { 
            product_url: product.product_url, 
            title: product.title,
            growth_rate: product.growth_rate,
            store_name: product.store_name 
        },
        is_read: false,
        created_at: new Date().toISOString()
    };
    
    // ⭐️ Correction: Use the provided userId instead of a hardcoded one
    if (!userAlertsStore.has(userId)) {
        userAlertsStore.set(userId, []);
    }
    userAlertsStore.get(userId).unshift(alertData);
}

setInterval(() => {
    updateTrendingProducts();
}, 2 * 60 * 60 * 1000);

setTimeout(() => {
    console.log('🚀 Démarrage des tâches automatiques du Dashboard...');
    runOpportunityScanner();
    updateTrendingProducts();
}, 5000);

// pour scraping des produits
const scrapeProductData = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); // ⭐️ Correction: Increased timeout

        const productData = await page.evaluate(() => {
            const data = {};
            let jsonLdData = null;
            try {
                const scriptElement = document.querySelector('script[type="application/ld+json"]');
                if (scriptElement) {
                    jsonLdData = JSON.parse(scriptElement.textContent);
                    if (jsonLdData && jsonLdData['@type'] === 'Product') {
                        data.title = jsonLdData.name || null;
                        data.description = jsonLdData.description || null;
                        data.price = jsonLdData.offers?.price ? parseFloat(jsonLdData.offers.price) : null;
                        data.storeName = jsonLdData.brand?.name || null;
                        data.averageRating = jsonLdData.aggregateRating?.ratingValue ? parseFloat(jsonLdData.aggregateRating.ratingValue) : null;
                        data.ratingsCount = jsonLdData.aggregateRating?.reviewCount ? parseInt(jsonLdData.aggregateRating.reviewCount, 10) : null;
                        data.image = Array.isArray(jsonLdData.image) ? jsonLdData.image[0] : jsonLdData.image;
                        if (jsonLdData.releaseDate) {
                            const date = new Date(jsonLdData.releaseDate);
                            data.dateAdded = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        }
                    }
                }
            } catch (e) {
                console.error('Erreur JSON-LD:', e);
            }

            if (!data.title) {
                const titleElement = document.querySelector('h1[itemprop="name"] span');
                data.title = titleElement ? titleElement.textContent.trim() : null;
            }

            if (!data.price) {
                const priceElement = document.querySelector('span[itemprop="price"]');
                const priceText = priceElement ? priceElement.textContent.trim() : 'N/A';
                data.price = priceText !== 'N/A' ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : null;
            }

            const keywords = [];
            const productMetadataSection = document.querySelector('div[class*="ProductRowCard-module__cardMetadata--"] section');
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
                                    keywords.push(trimmedTag);
                                }
                            });
                        }
                    }
                });
            }
            data.tags = keywords;
            
            const ccssStandards = [];
            const ccssSection = document.evaluate(
                "//div[./div[contains(text(), 'CCSS')]]",
                document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            ).singleNodeValue;

            if (ccssSection) {
                const standardElements = ccssSection.querySelectorAll('div[class*="StandardsList"] > div');
                standardElements.forEach(el => {
                    const text = el.textContent.trim();
                    if (text && text.length > 1) { 
                           ccssStandards.push(text.replace(/,$/, ''));
                    }
                });
            }
            data.ccss = ccssStandards;

            let pageDetails = null;
            const textContent = document.body.innerText;
            const match = textContent.match(/(\d+)\s*(page|pages)/i);
            if (match && match[1]) {
                pageDetails = parseInt(match[1], 10);
            }
            data.pageDetails = pageDetails;

            let storeUrl = null;
            if (data.storeName) {
                const storeLinkElement = document.querySelector(`a[href*="/store/${data.storeName.replace(/\s/g, '-')}/"]`); // ⭐️ Correction
                if (storeLinkElement) {
                    storeUrl = storeLinkElement.href;
                }
            }
            if (!storeUrl) {
                const genericStoreLink = document.querySelector('a[href*="/store/"]');
                if (genericStoreLink) {
                    storeUrl = genericStoreLink.href;
                }
            }
            data.storeUrl = storeUrl;

            const salesFactor = 10;
            data.estimatedSales = data.ratingsCount ? data.ratingsCount * salesFactor : null;
            data.estimatedProfit = (data.price && data.estimatedSales) ? data.price * data.estimatedSales : null;

            return data;
        });
        return productData;
    } catch (error) {
        console.error("Erreur produit:", error.message);
        throw new Error("Échec récupération produit.");
    } finally {
        if (browser) await browser.close();
    }
};

/** pour scraper les magasins
 */
const scrapeStoreData = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); // ⭐️ Correction: Increased timeout

       
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

            const productCards = document.querySelectorAll('[id^="product-row-"]');
            const products = [];
            const keywordCounts = {};

            productCards.forEach(card => {
                const titleElement = card.querySelector('h2 a[href*="/Product/"]');
                const title = titleElement ? titleElement.textContent.trim() : 'Titre non disponible';
                const productUrl = titleElement ? titleElement.href : null;

                const priceText = card.querySelector('[class*="ProductPrice-module__price--"]')?.textContent.trim() || null;
                const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;

                const ratingCountText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"]')?.textContent.trim() || "0";
                const ratingsCount = parseInt(ratingCountText.replace(/[^0-9]/g, ''), 10) || 0;

                const ratingValueText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"] > div')?.textContent.trim() || "0";
                const averageRating = parseFloat(ratingValueText) || 0;

                const storeElement = card.querySelector('a[href*="/store/"]');
                const storeName = storeElement ? storeElement.textContent.trim() : 'Magasin non disponible';
                const storeUrl = storeElement ? storeElement.href : null;

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
                products.push({
                    title, url: productUrl, price, ratingsCount, averageRating,
                    storeName, storeUrl,
                    estimatedSales: ratingsCount * 10,
                    estimatedRevenue: price * ratingsCount * 10
                });

                tags.forEach(tag => {
                    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
                    if (cleanTag.length > 2) {
                        keywordCounts[cleanTag] = (keywordCounts[cleanTag] || 0) + 1;
                    }
                });
            });

            result.topProducts = products
                .sort((a, b) => b.ratingsCount - a.ratingsCount)
                .slice(0, 10);

            result.relatedKeywords = Object.entries(keywordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word, count]) => ({ word, count }));

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

app.post('/api/analyze-product', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL produit requise.' });
    try {
        const data = await scrapeProductData(url);
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

app.get('/', (req, res) => {
    res.send('Serveur scraping TPT en ligne.');
});

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur port ${PORT}`);
});