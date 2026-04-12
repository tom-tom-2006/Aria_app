# ARIA - AI Makeup Coach - PRD

## Vision
ARIA est une application mobile d'assistant beauté IA qui transforme l'apprentissage du maquillage en une expérience interactive et personnalisée.

## Slogan
"L'intelligence artificielle au service de votre beauté"

## Stack Technique
- **Frontend**: Expo (React Native) avec Expo Router
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB (Motor async driver)
- **IA Chat**: OpenAI GPT 5.2 via Emergent LLM Key
- **Météo**: Open-Meteo API (gratuit, sans clé)
- **Auth**: JWT (email/password + bcrypt)

## Fonctionnalités MVP (v1.0)

### 1. Splash Screen Animé
- Animation ARIA avec fade-in/scale via Reanimated
- Redirection auto vers login ou home

### 2. Authentification
- Inscription (nom, email, mot de passe, ville)
- Connexion (email, mot de passe)
- JWT tokens (24h access, 7j refresh)
- Stockage sécurisé via AsyncStorage

### 3. Page d'Accueil (Home)
- Carte météo avec température, humidité, icône
- Conseil beauté personnalisé selon la météo
- Astuces beauté en scroll horizontal
- Bouton flottant chatbox (coin bas-droit)

### 4. Chatbox IA (GPT 5.2)
- Modal slide-up style iOS
- Conversation multi-tour avec historique
- Conseils maquillage et soins personnalisés
- Contexte utilisateur (nom, ville)

### 5. Tutoriels Maquillage
- 6 cours pré-seedés (Débutant → Avancé)
- Cards avec images Unsplash
- Steps expandables au tap
- Catégories: Quotidien, Soirée, Technique, Base, Lèvres

### 6. Looks Sauvegardés
- CRUD complet (créer, lire, supprimer)
- Sélection de produits par chips (16 produits)
- Notes optionnelles
- Sauvegarde persistante en DB

### 7. Profil
- Avatar avec initiales
- Infos utilisateur (nom, email, ville)
- Carte d'upgrade Premium (placeholder)
- Menu paramètres style iOS
- Déconnexion

## Design
- **Palette**: Noir (#000), Rose (#FF2D55), Blanc (#FFF)
- **Style**: 90% iOS (rounded corners, SF Pro fonts, glassmorphism)
- **Spacing**: 8pt grid
- **Touch targets**: 44px minimum

## API Endpoints
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| GET | /api/auth/me | Profil courant |
| GET | /api/weather?city=X | Météo + conseil |
| POST | /api/chat | Message IA |
| GET | /api/chat/history?session_id=X | Historique chat |
| GET | /api/tutorials | Liste tutoriels |
| GET | /api/tutorials/:id | Détail tutoriel |
| GET | /api/looks | Looks sauvegardés |
| POST | /api/looks | Créer un look |
| DELETE | /api/looks/:id | Supprimer un look |

## Phase 2 (Futures)
- Miroir IA (analyse faciale temps réel)
- Smart Shop (affiliation produits)
- Paiement Stripe/PayPal pour abonnement Premium
- Analyse de peau (hydratation, texture)
- Notifications push
- Mode hors-ligne
