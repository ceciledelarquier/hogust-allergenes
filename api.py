#!/usr/bin/env python3
"""
Serveur API Backend pour Hogust Allergènes
Gère les appels à OpenAI avec la clé API Hogust (sécurisée côté serveur)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permettre les requêtes depuis le front-end

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    print("⚠️  ATTENTION : Clé API OpenAI manquante !")
    print("   Créez un fichier .env avec : OPENAI_API_KEY=sk-...")

# Prompt système ultra-détaillé basé sur votre GPT
SYSTEM_PROMPT = """# HOGUST ALLERGÈNES - Assistant Conformité HACCP

## IDENTITÉ
Assistant spécialisé pour boulangers-pâtissiers français.
**Mission :** Générer des listes d'allergènes conformes Règlement UE 1169/2011.
**Ton :** Rigoureux sur la conformité, précis et exhaustif.

## RÈGLES CRITIQUES

1. **Exactitude absolue** : Uniquement les ingrédients fournis, jamais d'invention
2. **Ingrédients composés** : Pour pâte feuilletée, chocolat, praliné, margarine → analyser avec hypothèses prudentes (+ d'allergènes en cas de doute)
3. **14 allergènes UE uniquement** : Gluten, œufs, lait, fruits à coque, arachides, soja, céleri, moutarde, sésame, sulfites, lupin, mollusques, poissons, crustacés
4. **Variantes distinctes** : "Croissant nature" ≠ "Croissant amandes"

## BASE DE DONNÉES INGRÉDIENTS

### INGRÉDIENTS COMPOSÉS (hypothèses prudentes si détails manquants)
- Pâte feuilletée → 🌾 Gluten, 🥛 Lait (beurre probable)
- Chocolat → 🥛 Lait (sauf si "noir" précisé), 🌰 Fruits à coque (traces possibles)
- Praliné → 🌰 Fruits à coque (noisettes/amandes), 🥛 Lait
- Margarine → 🥛 Lait (parfois), 🌱 Soja (souvent)
- Levure chimique → 🌾 Gluten (traces possibles)
- Nappage → 💨 Sulfites (souvent)

### INGRÉDIENTS SIMPLES
- Farine blé/épeautre/seigle/avoine → 🌾 Gluten
- Œufs/jaunes/blancs → 🥚 Œufs
- Lait/crème/beurre/fromage → 🥛 Lait
- Amandes/noisettes/noix → 🌰 Fruits à coque
- Cacahuètes → 🥜 Arachides
- Lécithine/farine/lait de soja → 🌱 Soja
- Graines de sésame → ⚪ Sésame
- Farine de lupin → 🌼 Lupin
- Fruits secs (abricots, raisins) → 💨 Sulfites

### INGRÉDIENTS SANS ALLERGÈNES
Eau, sel, sucre, miel, levure boulanger, vanille, cacao pur, fruits frais, huile tournesol/colza

## FORMAT DE RÉPONSE

Tu DOIS retourner un JSON strict avec cette structure exacte :
```json
{
  "products": [
    {
      "name": "Nom du produit",
      "allergens": ["Gluten", "Œufs", "Lait"],
      "traces": ["Fruits à coque", "Sésame"]
    }
  ]
}
```

- **name** : Nom exact du produit (ne pas inventer)
- **allergens** : Liste des allergènes PRÉSENTS dans la recette
- **traces** : Liste des traces possibles (contamination croisée probable en boulangerie)

Si une recette n'a AUCUN allergène détecté, mets une liste vide `[]`.

## TRACES SYSTÉMATIQUES EN BOULANGERIE
Si l'atelier manipule généralement :
- Gluten (farine en suspension)
- Fruits à coque (si utilisés dans d'autres produits)
- Sésame (graines volatiles)

→ Les ajouter dans "traces" même si pas dans la recette spécifique.

## CONFORMITÉ LÉGALE
Règlement UE 1169/2011 + Décret 2015-447
Affichage obligatoire depuis 1er juillet 2015
"""


@app.route('/health', methods=['GET'])
def health():
    """Point de contrôle pour vérifier que le serveur fonctionne"""
    return jsonify({
        'status': 'ok',
        'api_key_configured': bool(OPENAI_API_KEY)
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint principal : reçoit le contenu de recette et retourne les allergènes
    Body attendu : { "content": "...", "isImage": false }
    """
    try:
        data = request.get_json()
        content = data.get('content')
        is_image = data.get('isImage', False)
        
        if not content:
            return jsonify({'error': 'Contenu manquant'}), 400
        
        if not OPENAI_API_KEY:
            return jsonify({'error': 'Clé API non configurée sur le serveur'}), 500
        
        # Préparer le message utilisateur
        if is_image:
            user_message = [
                {
                    "type": "text",
                    "text": "Analyse cette image de recette. Extrais les produits et leurs allergènes selon les règles définies."
                },
                {
                    "type": "image_url",
                    "image_url": {"url": content}
                }
            ]
        else:
            user_message = f"Analyse ce texte de recette. Extrais les produits et leurs allergènes.\n\nCONTENU DE LA RECETTE:\n{content}"
        
        # Appel à OpenAI
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}'
            },
            json={
                'model': 'gpt-4o',
                'messages': [
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': user_message}
                ],
                'response_format': {'type': 'json_object'}
            }
        )
        
        if response.status_code != 200:
            error_data = response.json()
            return jsonify({'error': error_data.get('error', {}).get('message', 'Erreur API OpenAI')}), response.status_code
        
        result = response.json()
        content_text = result['choices'][0]['message']['content']
        parsed_result = json.loads(content_text)
        
        return jsonify(parsed_result)
    
    except Exception as e:
        print(f"Erreur serveur : {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    if not OPENAI_API_KEY:
        print("\n" + "="*60)
        print("⚠️  CONFIGURATION REQUISE")
        print("="*60)
        print("Créez un fichier .env dans ce dossier avec :")
        print("OPENAI_API_KEY=sk-votre_cle_ici")
        print("="*60 + "\n")
    
    print("🚀 Serveur Hogust Allergènes démarré sur http://localhost:5000")
    app.run(debug=True, port=5000)
