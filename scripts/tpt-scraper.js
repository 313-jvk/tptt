// scripts/tpt-scraper.js
// Script de web scraping pour alimenter la base de données TPT Niche Navigator

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Liste de mots-clés à surveiller pour les opportunités
const KEYWORDS_TO_MONITOR = [
  'phonics worksheets',
  'math centers',
  'reading comprehension',
  'science experiments',
  'sight words',
  'kindergarten activities',
  'first grade math',
  'second grade reading',
  'third grade science',
  'fourth grade social studies',
  'fifth grade writing',
  'middle school math',
  'elementary art',
  'preschool learning',
  'special education',
  'ESL activities',
  'winter activities',
  'spring worksheets',
  'summer learning',
  'back to school',
  'holiday crafts',
  'classroom management',
  'bulletin boards',
  'teacher resources',
  'homeschool curriculum'
];

// Headers pour éviter la détection de bot
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Fonction utilitaire pour attendre
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fonction pour extraire les données d'un produit TPT
 */
async function scrapeProductData(productUrl) {
  try {
    console.log(`Scraping produit: ${productUrl}`);
    
    const response = await axios.get(productUrl, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Extraction des données
    const title = $('h1[data-testid="product-title"]').text().trim() || 
                  $('.product-title h1').text().trim() ||
                  $('h1').first().text().trim();
    
    const priceText = $('.price-current').text() || 
                      $('[data-testid="price"]').text() || 
                      $('.product-price').text();
    
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    
    const ratingsText = $('.ratings-count').text() || 
                        $('[data-testid="ratings-count"]').text() ||
                        $('.review-count').text();
    
    const ratingsCount = parseInt(ratingsText.replace(/[^0-9]/g, '')) || 0;
    
    const ratingValue = parseFloat($('.star-rating').attr('data-rating')) || 
                        parseFloat($('[data-testid="average-rating"]').text()) || 
                        0;
    
    const storeName = $('.store-name a').text().trim() || 
                      $('[data-testid="store-name"]').text().trim() ||
                      $('.seller-name').text().trim();
    
    const storeUrl = $('.store-name a').attr('href') || 
                     $('[data-testid="store-link"]').attr('href') || '';
    
    // Extraction des tags/mots-clés
    const tags = [];
    $('.product-tags a, .tag-list a, [data-testid="tag"]').each((i, elem) => {
      const tag = $(elem).text().trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    // Extraction de la description pour plus de mots-clés
    const description = $('.product-description, [data-testid="description"]').text().toLowerCase();
    const descriptionWords = description.match(/\b[a-z]{3,}\b/g) || [];
    descriptionWords.forEach(word => {
      if (!tags.includes(word) && tags.length < 20) {
        tags.push(word);
      }
    });
    
    // Estimation des ventes et revenus
    const estimatedSales = ratingsCount * 12; // Coefficient multiplicateur estimé
    const estimatedRevenue = estimatedSales * price;
    
    return {
      product_url: productUrl,
      title,
      price,
      store_name: storeName,
      store_url: storeUrl.startsWith('http') ? storeUrl : `https://www.teacherspayteachers.com${storeUrl}`,
      ratings_count: ratingsCount,
      average_rating: ratingValue,
      estimated_sales: estimatedSales,
      estimated_revenue: estimatedRevenue,
      tags: tags.slice(0, 15), // Limiter à 15 tags
      date_added: new Date().toISOString().split('T')[0]
    };
    
  } catch (error) {
    console.error(`Erreur scraping ${productUrl}:`, error.message);
    return null;
  }
}

/**
 * Recherche et analyse des produits pour un mot-clé
 */
async function analyzeKeyword(keyword) {
  try {
    console.log(`Analyse du mot-clé: ${keyword}`);
    
    // URL de recherche TPT
    const searchUrl = `https://www.teacherspayteachers.com/Browse/Search:${encodeURIComponent(keyword)}`;
    
    const response = await axios.get(searchUrl, { 
      headers: HEADERS,
      timeout: 15000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Extraction des liens de produits
    const productLinks = [];
    $('.product-item a, .search-result-item a, [data-testid="product-link"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/Product/') && !productLinks.includes(href)) {
        const fullUrl = href.startsWith('http') ? href : `https://www.teacherspayteachers.com${href}`;
        productLinks.push(fullUrl);
      }
    });
    
    // Limiter à 20 produits pour éviter la surcharge
    const limitedLinks = productLinks.slice(0, 20);
    
    // Scraper quelques produits pour calculer les moyennes
    const productData = [];
    for (let i = 0; i < Math.min(5, limitedLinks.length); i++) {
      const data = await scrapeProductData(limitedLinks[i]);
      if (data) {
        productData.push(data);
      }
      await sleep(2000); // Attendre 2 secondes entre chaque requête
    }
    
    if (productData.length === 0) {
      console.log(`Aucune donnée récupérée pour: ${keyword}`);
      return null;
    }
    
    // Calculer les statistiques
    const totalProducts = limitedLinks.length;
    const averagePrice = productData.reduce((sum, p) => sum + p.price, 0) / productData.length;
    const averageRating = productData.reduce((sum, p) => sum + p.average_rating, 0) / productData.length;
    const averageRatings = productData.reduce((sum, p) => sum + p.ratings_count, 0) / productData.length;
    
    // Déterminer le niveau de concurrence
    let competitionLevel = 'Faible';
    let competitionScore = 0;
    
    if (totalProducts > 1000) {
      competitionLevel = 'Élevé';
      competitionScore = 70 + (totalProducts / 100);
    } else if (totalProducts > 500) {
      competitionLevel = 'Moyen';
      competitionScore = 40 + (totalProducts / 50);
    } else {
      competitionLevel = 'Faible';
      competitionScore = Math.min(40, totalProducts / 10);
    }
    
    return {
      keyword,
      total_products: totalProducts,
      average_price: Math.round(averagePrice * 100) / 100,
      average_rating: Math.round(averageRating * 100) / 100,
      competition_level: competitionLevel,
      competition_score: Math.round(competitionScore),
      sample_products: productData
    };
    
  } catch (error) {
    console.error(`Erreur analyse mot-clé ${keyword}:`, error.message);
    return null;
  }
}

/**
 * Fonction principale de scraping
 */
async function runScraping() {
  console.log('🚀 Début du scraping TPT...');
  
  try {
    // Analyser chaque mot-clé
    for (const keyword of KEYWORDS_TO_MONITOR) {
      console.log(`\n📊 Traitement: ${keyword}`);
      
      const keywordData = await analyzeKeyword(keyword);
      
      if (keywordData) {
        // Sauvegarder l'opportunité de mot-clé
        const { error: keywordError } = await supabase
          .from('keyword_opportunities')
          .upsert({
            keyword: keywordData.keyword,
            total_products: keywordData.total_products,
            average_price: keywordData.average_price,
            average_rating: keywordData.average_rating,
            competition_level: keywordData.competition_level,
            competition_score: keywordData.competition_score,
            updated_at: new Date().toISOString(),
            last_scanned_at: new Date().toISOString(),
            is_active: true
          }, {
            onConflict: 'keyword'
          });
        
        if (keywordError) {
          console.error('Erreur sauvegarde mot-clé:', keywordError);
        } else {
          console.log(`✅ Mot-clé "${keyword}" sauvegardé`);
        }
        
        // Sauvegarder les produits échantillon comme produits tendance
        for (const product of keywordData.sample_products) {
          // Calculer le taux de croissance (simulé pour l'exemple)
          const growthRate = Math.max(0, (product.ratings_count - 50) / 5);
          
          const { error: productError } = await supabase
            .from('trending_products')
            .upsert({
              ...product,
              growth_rate: Math.round(growthRate * 100) / 100,
              updated_at: new Date().toISOString(),
              last_scanned_at: new Date().toISOString(),
              is_trending: growthRate > 10
            }, {
              onConflict: 'product_url'
            });
          
          if (productError) {
            console.error('Erreur sauvegarde produit:', productError);
          }
        }
      }
      
      // Attendre entre chaque mot-clé pour éviter d'être bloqué
      await sleep(5000);
    }
    
    console.log('\n✅ Scraping terminé avec succès!');
    
    // Traiter les alertes automatiques
    console.log('\n🔔 Traitement des alertes automatiques...');
    await processAutomaticAlerts();
    
  } catch (error) {
    console.error('❌ Erreur générale de scraping:', error);
  }
}

/**
 * Fonction pour traiter les alertes automatiques
 */
async function processAutomaticAlerts() {
  try {
    // Récupérer les mots-clés suivis par les utilisateurs
    const { data: trackedKeywords, error } = await supabase
      .from('user_tracked_keywords')
      .select(`
        *,
        users!inner(user_id)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Erreur récupération mots-clés suivis:', error);
      return;
    }

    for (const tracked of trackedKeywords || []) {
      // Vérifier si il y a une opportunité pour ce mot-clé
      const { data: opportunity } = await supabase
        .from('keyword_opportunities')
        .select('*')
        .eq('keyword', tracked.keyword)
        .eq('is_active', true)
        .single();

      if (opportunity && opportunity.opportunity_score >= tracked.alert_threshold) {
        // Vérifier si une alerte similaire n'a pas déjà été créée récemment
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentAlert } = await supabase
          .from('user_alerts')
          .select('id')
          .eq('user_id', tracked.user_id)
          .eq('alert_type', 'keyword_opportunity')
          .gte('created_at', yesterday.toISOString())
          .ilike('title', `%${tracked.keyword}%`)
          .single();

        if (!recentAlert) {
          // Créer l'alerte
          const { error: alertError } = await supabase
            .from('user_alerts')
            .insert({
              user_id: tracked.user_id,
              alert_type: 'keyword_opportunity',
              title: `Opportunité détectée: ${tracked.keyword}`,
              description: `Le mot-clé "${tracked.keyword}" a un score d'opportunité de ${opportunity.opportunity_score}/100 avec une concurrence ${opportunity.competition_level.toLowerCase()}.`,
              data: {
                keyword: tracked.keyword,
                opportunity_score: opportunity.opportunity_score,
                competition_level: opportunity.competition_level,
                average_price: opportunity.average_price
              },
              is_read: false,
              is_active: true
            });

          if (!alertError) {
            console.log(`📢 Alerte créée pour utilisateur ${tracked.user_id}: ${tracked.keyword}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur processAutomaticAlerts:', error);
  }
}

// Lancer le scraping si ce script est exécuté directement
if (require.main === module) {
  runScraping().then(() => {
    console.log('Script terminé');
    process.exit(0);
  }).catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  runScraping,
  analyzeKeyword,
  scrapeProductData,
  processAutomaticAlerts
}; 