# 🚀 Guide de Configuration - Hogust Allergènes

## Architecture
L'application fonctionne en 2 parties :
1. **Frontend** (HTML/JS) : L'interface utilisateur
2. **Backend** (Python Flask) : Gère les appels à OpenAI avec votre clé API

## Installation (Une seule fois)

### 1. Configuration de la clé API

**Important** : La clé API OpenAI doit être configurée côté serveur pour que les utilisateurs n'aient PAS à entrer leur propre clé.

```bash
cd allergenes-app

# Copiez le fichier exemple
cp .env.example .env

# Éditez le fichier .env et ajoutez votre clé
nano .env
```

Dans le fichier `.env`, mettez :
```
OPENAI_API_KEY=sk-votre_vraie_clé_openai_ici
```

### 2. Installation des dépendances Python (déjà fait ✅)

Les packages sont déjà installés :
- Flask (serveur web)
- Flask-CORS (pour les requêtes cross-origin)
- python-dotenv (pour lire le fichier .env)
- requests (pour appeler OpenAI)

## Utilisation Quotidienne

### Démarrer l'application

Vous devez lancer **2 serveurs** en même temps (dans 2 terminaux différents) :

#### Terminal 1 : Backend API (Flask)
```bash
cd allergenes-app
python3 api.py
```
✅ Serveur démarré sur http://localhost:5000

#### Terminal 2 : Frontend (HTML)
```bash
cd allergenes-app
python3 -m http.server 8000
```
✅ Application accessible sur http://localhost:8000

### Tester l'application

1. Ouvrez http://localhost:8000 dans votre navigateur
2. Vous devriez voir "✓ Prêt" en haut à droite
3. Uploadez un fichier de recette (Excel, Word ou Photo)
4. L'IA analyse et affiche les allergènes

## Dépannage

### "⚠ Serveur offline"
Le backend n'est pas démarré. Vérifiez que `python3 api.py` tourne.

### "Clé API non configurée"
Le fichier `.env` est manquant ou la clé est invalide.

### "CORS Policy Error"
Assurez-vous que les 2 serveurs (5000 et 8000) sont bien démarrés.

## Déploiement en Production

Pour rendre l'app accessible en ligne (allergenes.hogust.fr) :

### Frontend : Netlify (Gratuit)
1. Upload du dossier `allergenes-app` sur Netlify
2. Configure le domaine `allergenes.hogust.fr`

### Backend : PythonAnywhere ou Render (Gratuit)
1. Créez un compte sur [Render.com](https://render.com)
2. Créez un "Web Service" depuis le repository GitHub
3. Ajoutez la variable d'environnement `OPENAI_API_KEY`
4. Update `API_BASE_URL` dans `app.js` avec l'URL render
