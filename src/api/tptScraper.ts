// Définissez l'URL de base de votre API Render


export const analyzeTPTProduct = async (url: string) => {
  try {
    // Utilisez l'URL complète pour la requête
    const response = await fetch('https://tpt-niche-navigator-main.onrender.com/api/analyze-product', { 
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