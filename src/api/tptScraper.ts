// src/api/tptScraper.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const analyzeTPTProduct = async (url: string) => {
  try {
    // Utilisez l'URL complète en combinant la variable d'environnement et le chemin de l'API.
    const response = await fetch(`${API_URL}/api/analyze-product`, { 
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ url })
   }); 

    if (!response.ok) {
     throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
 }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error; 
 }
};