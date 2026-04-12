# ARIA - AI Makeup Coach - PRD v2

## Vision
ARIA transforme l'apprentissage du maquillage avec une IA personnalisée, un studio caméra et un design 90% iOS.

## Stack Technique
- **Frontend**: Expo (React Native) + Expo Router + expo-camera
- **Backend**: FastAPI (Python) + MongoDB (Motor)
- **IA Chat**: OpenAI GPT 5.2 via Emergent LLM Key
- **Météo**: Open-Meteo API (gratuit)
- **Auth**: JWT (email/password + bcrypt)

## Fonctionnalités v2

### Accueil (redesigné)
- Météo compacte + conseil peau personnalisé
- Bouton principal "Accéder au Studio"
- Accès rapide : Chat IA + Soins (verrouillé FREE)

### Sélection Produits
- 4 catégories : Lèvres, Yeux, Teint, Joues
- Choix de teinte pour chaque produit (couleurs visuelles)
- Bouton "Lancer le Studio" avec produits sélectionnés

### Studio Caméra
- Flux caméra front/back avec expo-camera
- Overlay des produits sélectionnés
- Guidage IA (Phase 3)

### Tutoriels Premium
- 4 cours gratuits, 2 cours premium (verrouillés)
- Expand/collapse des étapes
- Bouton "Lancer dans le Studio" pour chaque cours

### Profil Modifiable
- Modification nom, email, ville, mot de passe
- Carte d'abonnement Premium
- Bouton Administration (admin uniquement)

### Dashboard Admin (tom@gmail.com)
- Stats réelles : utilisateurs, looks, messages, tutoriels
- Répartition abonnements (free/premium)
- Liste utilisateurs récents

### Chatbox IA (GPT 5.2)
- Bouton flottant sur l'accueil
- Conseils beauté personnalisés en français

## Comptes
- Admin : tom@gmail.com / Tomcle62
- Utilisateurs : inscription via l'app
