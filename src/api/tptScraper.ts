// src/api/tptScraper.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const analyzeTPTProduct = async (url: string) => {
  try {
    console.log('Envoi de la requête vers:', `${API_URL}/api/analyze-product`);
    
    const response = await fetch(`${API_URL}/api/analyze-product`, { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    }); 

    console.log('Réponse reçue, status:', response.status);

    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        const textError = await response.text();
        errorMessage = textError || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Données reçues:', data);
    
    if (!data.success && data.success !== undefined) {
      throw new Error(data.message || 'Erreur lors de l\'analyse du produit');
    }
    
    return data;
    
  } catch (error) {
    console.error("Erreur API analyzeTPTProduct:", error);
    
    if (error instanceof Error) {
      // Si c'est une erreur réseau
      if (error.message.includes('fetch')) {
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
      
      // Si c'est une erreur de timeout
      if (error.message.includes('timeout')) {
        throw new Error('La requête a pris trop de temps. Réessayez dans quelques instants.');
      }
      
      throw error;
    }
    
    throw new Error('Une erreur inconnue s\'est produite lors de l\'analyse du produit');
  }
};

// Fonction pour analyser un mot-clé (si vous l'utilisez)
export const analyzeTPTKeyword = async (keyword: string) => {
  try {
    const response = await fetch(`${API_URL}/api/analyze-keyword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ keyword })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur API analyzeTPTKeyword:", error);
    throw error;
  }
};

// Fonction pour analyser un magasin (si vous l'utilisez)
export const analyzeTPTStore = async (url: string) => {
  try {
    const response = await fetch(`${API_URL}/api/analyze-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur API analyzeTPTStore:", error);
    throw error;
  }
}; 

