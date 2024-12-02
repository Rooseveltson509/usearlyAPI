import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Tesseract from 'tesseract.js';


dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Assurez-vous que votre clé API est définie dans vos variables d'environnement
});


// Vérification de la clé API
if (!process.env.OPENAI_API_KEY) {
    console.error("Erreur : Clé API OpenAI non définie dans les variables d'environnement.");
    process.exit(1);
}



export const service = {
    // Utilisation de Tesseract pour extraire du texte depuis une image
    extractTextFromImage: async function (imagePath) {
        try {
            const result = await Tesseract.recognize(imagePath, 'fra'); // Utilisez 'fra' pour le français ou 'eng' pour l'anglais
            console.log("Texte extrait par Tesseract :", result.data.text);
            return result.data.text; // Texte brut extrait
        } catch (error) {
            console.error("Erreur lors de l'extraction du texte avec Tesseract :", error);
            return ''; // Retournez une chaîne vide en cas d'erreur
        }
    },

    // Méthode pour déterminer le bugLocation à partir du texte extrait
    determineBugLocation: async function (textExtracted) {
        if (!textExtracted) {
            return "Emplacement inconnu";
        }

        // Logique de correspondance basée sur des mots-clés
        const textLower = textExtracted.toLowerCase();
        if (textLower.includes("panier") || textLower.includes("checkout")) {
            return "panier";
        }
        if (textLower.includes("connexion") || textLower.includes("login")) {
            return "page de connexion";
        }
        if (textLower.includes("inscription") || textLower.includes("signup")) {
            return "page d'inscription";
        }
        if (textLower.includes("produit") || textLower.includes("catalogue")) {
            return "page produit";
        }

        // Utilisation d'OpenAI si aucune correspondance claire
        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: `
    Voici un extrait d'une capture d'écran : "${textExtracted}".
    Basé sur ce texte, où l'utilisateur semble-t-il se trouver sur le site ? 
    Répondez sous la forme : "Page : [Nom de la page]".
                        `
                }
            ]
        });

        if (openaiResponse && openaiResponse.choices[0]) {
            const gptResponse = openaiResponse.choices[0].message.content.trim();
            console.log("Réponse OpenAI pour bugLocation :", gptResponse);
            return gptResponse.replace("Page :", "").trim();
        }

        return "Emplacement inconnu";
    },

    // Récupération des métadonnées du site
    getCategories: async function (description) {
        try {
            const prompt = `
            Un utilisateur a signalé le problème suivant : "${description}".
            Basé sur cette description, déterminez les catégories les plus pertinentes pour classer ce problème, environ 4 suggestions
    
            Répondez sous le format suivant :
            Catégories :
            - [Catégorie 1]
            - [Catégorie 2]
            - [Catégorie 3]
            - [Catégorie 4]
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.7,
            });

            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                const text = response.choices[0].message.content.trim();
                console.log("Réponse brute d'OpenAI :", text);

                // Parse the response for categories
                const categories = text.match(/- (.+)/g).map(cat => cat.replace('- ', '').trim());
                return categories;
            } else {
                console.error('Réponse d’OpenAI invalide :', response);
                return [];
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories depuis OpenAI :', error);
            return [];
        }
    },

    getSiteMetadata: async function (url) {
        try {
            // Importer dynamiquement node-fetch
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            const title = $('title').text();
            const description = $('meta[name="description"]').attr('content') || '';
            return { title, description };
        } catch (error) {
            console.error('Erreur lors de la récupération des métadonnées du site:', error);
            return { title: '', description: '' };
        }
    },

    getCategoriesAndSiteType: async function (description, siteMetadata, existingCategories, existingSiteTypes) {
        try {
            const prompt = `
            Un utilisateur a signalé le problème suivant : "${description}".
            Métadonnées du site : Titre - "${siteMetadata.title}", Description - "${siteMetadata.description}".
            Types de sites disponibles : ${existingSiteTypes.join(', ')}.
            Catégories de bugs disponibles : ${existingCategories.join(', ')}.
    
            Basé sur les informations ci-dessus :
            1. Déterminez le type de site le plus approprié parmi les types de sites disponibles.
            2. Proposez 4 catégories de bugs les plus pertinentes parmi les catégories de bugs disponibles.
    
            Répondez sous le format suivant :
            Type de site : [Type de site]
            Catégories :
            - [Catégorie 1]
            - [Catégorie 2]
            - [Catégorie 3]
            - [Catégorie 4]
            `;
            console.log("Prompt généré :", prompt);
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.7,
            });
            console.log("Réponse brute OpenAI :", response);
            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                const text = response.choices[0].message.content.trim();
                return this.parseOpenAIResponse(text);
            } else {
                console.error('Réponse d’OpenAI invalide :', response);
                return { siteType: 'Inconnu', categories: [] };
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories et du type de site depuis OpenAI :', error);
            return { siteType: 'Inconnu', categories: [] };
        }
    },


    parseOpenAIResponse: function (responseText) {
        if (!responseText) {
            console.error('La réponse d’OpenAI est vide ou invalide.');
            return { siteType: 'Inconnu', categories: [] };
        }

        console.log("Réponse brute à parser :", responseText);

        const lines = responseText.split('\n').map(line => line.trim());
        let siteType = '';
        const categories = [];

        lines.forEach(line => {
            if (line.startsWith('Type de site :')) {
                siteType = line.replace('Type de site :', '').trim();
            } else if (line.startsWith('- ')) {
                categories.push(line.replace('- ', '').trim());
            }
        });

        if (!siteType) {
            console.warn('Type de site non détecté dans la réponse.');
        }

        if (categories.length === 0) {
            console.warn('Catégories non détectées dans la réponse.');
        }

        if (!siteType || categories.length === 0) {
            console.error('Impossible de parser la réponse OpenAI correctement :', responseText);
            return { siteType: 'Inconnu', categories: ['Autre'] }; // Ajouter une valeur par défaut
        }


        return { siteType, categories };
    }

};