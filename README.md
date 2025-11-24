# Hogust Allergènes App

Application web pour générer des étiquettes allergènes à partir de recettes (Excel, Word, Photo).

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.9+
- Une clé API OpenAI

### Installation

1. **Configurer la clé API** :
   ```bash
   cd allergenes-app
   cp .env.example .env
   # Éditez .env et ajoutez votre clé OpenAI
   ```

2. **Installer les dépendances** (déjà fait) :
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Lancer l'application** (2 terminaux) :
   
   Terminal 1 - Backend API :
   ```bash
   python3 api.py
   ```
   
   Terminal 2 - Frontend :
   ```bash
   python3 -m http.server 8000
   ```

4. **Accéder à l'app** : http://localhost:8000

📖 Pour plus de détails, consultez [SETUP.md](SETUP.md)

## Technologies
- **React** (via CDN)
- **Tailwind CSS**
- **Flask** (Backend API)
- **OpenAI GPT-4o**
