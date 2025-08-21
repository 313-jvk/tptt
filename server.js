import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// pour scraping des produits
const scrapeProductData = async (url) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

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
                const storeLinkElement = document.querySelector(`a[href*="/store/${data.storeName.replace(/\s/g, '-')}"]`);
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

/**
 * Nouvelle fonction pour scraper les données de mots-clés.
 */
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
            const keywordCounts = {};

            productCards.forEach(card => {
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
               
                tags.forEach(tag => {
                    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
                    if (cleanTag.length > 2) {
                        keywordCounts[cleanTag] = (keywordCounts[cleanTag] || 0) + 1;
                    }
                });
            });

            
            result.relatedKeywords = Object.entries(keywordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word, count]) => ({ word, count }));


            
            let totalRating = 0;
            let totalProductsCounted = 0;
            let totalProductsPrice = 0;

            productCards.forEach(card => {
                const priceText = card.querySelector('[class*="ProductPrice-module__price--"]')?.textContent.trim() || null;
                const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;
                
                const ratingCountText = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"]')?.textContent.trim() || "0";
                const ratingsCount = parseInt(ratingCountText.replace(/[^0-9]/g, ''), 10) || 0;
                const ratingValue = card.querySelector('[class*="RatingsLabel-module__ratingsLabelContainer--"] > div')?.textContent.trim() || "0";
                const rating = parseFloat(ratingValue) || 0;

                if (ratingsCount > 0) {
                    totalRating += rating;
                    totalProductsCounted++;
                }
                totalProductsPrice += price;
            });
            
            result.averageRating = totalProductsCounted > 0 ? parseFloat((totalRating / totalProductsCounted).toFixed(1)) : 0;
            result.averagePrice = totalProductsCounted > 0 ? parseFloat((totalProductsPrice / totalProductsCounted).toFixed(2)) : 0;
            
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
            relatedKeywords: data.relatedKeywords
        };

    } catch (error) {
        console.error("Erreur mot-clé:", error.message);
        throw new Error("Échec récupération mot-clé.");
    } finally {
        if (browser) await browser.close();
    }
};

// pour les mots cle
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
// ---------------------------------------------

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
