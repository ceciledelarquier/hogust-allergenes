# 🚀 Guide de Déploiement - Hogust Allergènes

## Architecture de Production

```
allergenes.hogust.fr (Frontend)
        ↓
api-allergenes.hogust.fr (Backend API)
        ↓
OpenAI GPT-4o
```

---

## 🎯 Option 1 : Solution Gratuite (Recommandée pour débuter)

### A. Déployer le Backend sur **Render.com**

#### 1. Préparer le code
Créez un fichier `render.yaml` dans `allergenes-app/` :
```yaml
services:
  - type: web
    name: hogust-allergenes-api
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn api:app"
    envVars:
      - key: OPENAI_API_KEY
        sync: false
```

Ajoutez `gunicorn` à `requirements.txt` :
```bash
echo "gunicorn==21.2.0" >> requirements.txt
```

#### 2. Déployer
1. Créez un compte sur [render.com](https://render.com)
2. Connectez votre GitHub (poussez le code d'abord)
3. "New" → "Web Service"
4. Sélectionnez votre repository
5. Dans "Environment Variables", ajoutez :
   - Key: `OPENAI_API_KEY`
   - Value: `sk-votre_clé...`
6. Cliquez "Create Web Service"

✅ Votre API sera sur : `https://hogust-allergenes-api.onrender.com`

#### 3. Mettre à jour le Frontend
Dans `app.js`, changez :
```javascript
const API_BASE_URL = 'https://hogust-allergenes-api.onrender.com';
```

### B. Déployer le Frontend sur **Netlify**

#### 1. Préparer le déploiement
Créez un fichier `netlify.toml` dans `allergenes-app/` :
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build]
  publish = "."
```

#### 2. Déployer
1. Allez sur [netlify.com](https://netlify.com)
2. "Add new site" → "Deploy manually"
3. Glissez le dossier `allergenes-app/` complet
4. Attendez le déploiement (~30s)

✅ Votre app est en ligne : `https://random-name.netlify.app`

#### 3. Configurer le domaine custom
1. Dans Netlify : "Domain settings"
2. "Add custom domain" → `allergenes.hogust.fr`
3. Suivez les instructions pour configurer le DNS chez votre registrar de domaine

---

## 🏆 Option 2 : Solution Pro (Payante mais robuste)

### Backend : **Railway.app** ($5/mois)
- Pas de mise en veille
- Meilleure performance
- Plus de RAM

### Frontend : **Vercel** (Gratuit)
- Alternative à Netlify
- Excellent pour React
- Configuration domaine facile

---

## 📋 Checklist Post-Déploiement

Après déploiement, vérifiez :

- [ ] Backend accessible : `https://votre-api.onrender.com/health`
- [ ] Frontend affiche "✓ Prêt" (pas "⚠ Serveur offline")
- [ ] Upload d'un fichier Excel fonctionne
- [ ] Les allergènes s'affichent correctement
- [ ] Impression fonctionne

---

## 🔒 Sécurité

### Variables d'environnement
✅ La clé API est UNIQUEMENT côté backend (jamais exposée au frontend)
✅ Le fichier `.env` n'est JAMAIS commité (vérifié par `.gitignore`)

### CORS
Le backend Flask accepte les requêtes depuis votre domaine unique. Si besoin de restreindre :

Dans `api.py`, ligne `CORS(app)`, remplacez par :
```python
CORS(app, origins=["https://allergenes.hogust.fr"])
```

---

## 💰 Coûts Estimés

### Solution Gratuite (Render + Netlify)
- **Hébergement** : 0€
- **Domaine** : ~12€/an (si vous n'avez pas déjà hogust.fr)
- **OpenAI API** : ~0,02€ par recette analysée
  - 100 recettes/mois = ~2€
  - 500 recettes/mois = ~10€

### Solution Pro (Railway + Vercel)
- **Hébergement** : ~5€/mois
- **Domaine** : ~12€/an
- **OpenAI API** : même prix

---

## 🐛 Dépannage Production

### "Serveur offline" en production
1. Vérifiez que le backend Render est "Running" (pas en veille)
2. Testez `https://votre-api.onrender.com/health` directement
3. Vérifiez les logs Render pour erreurs

### "429 Too Many Requests" (OpenAI)
Votre clé API a dépassé le quota → Vérifiez votre compte OpenAI

### Temps de réponse lent
Normal avec le plan gratuit Render (réveil après inactivité). Solution :
- Passer à Railway ($5/mois)
- Ou configurer un ping toutes les 10 min (ex: UptimeRobot)

---

## 📞 Support

En cas de problème, vérifiez dans cet ordre :
1. Logs backend (Render dashboard)
2. Console navigateur (F12 → Console)
3. Variables d'environnement sur Render

---

**Prochaine étape recommandée :** Commencez avec Render (gratuit) pour tester, puis migrez vers Railway si vous avez beaucoup de trafic.
