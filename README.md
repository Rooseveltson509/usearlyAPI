# api rest full - USEARLY_API

_(des badges sympatiques)_

[![forthebadge](https://forthebadge.com/images/badges/made-with-crayons.svg)](http://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/powered-by-electricity.svg)](https://forthebadge.com)

## Pour commencer

# API Node.js pour le Reporting

## Description

# USEARLY_API – API REST Node.js

## ✨ Description

Cette API RESTful, construite avec **Node.js**, **Express** et **Sequelize**, alimente **Usearly**, une plateforme qui permet aux utilisateurs :
- de **signaler des bugs** sur des sites web,
- de **suggérer des idées** d’amélioration,
- de partager des **coups de cœur**.

Cette API est utilisée à la fois par une **interface web** et une **extension Chrome**.  
Elle inclut un système de **gamification**, **reactions emojis**, **authentification JWT + refreshToken**, **détection de contexte**, etc.

---

## 🧱 Stack Technique

- **Backend** : Node.js, Express, Sequelize (MySQL)
- **Auth** : JWT (accessToken + refreshToken), gestion CSRF
- **Frontend** : React (Vite + TypeScript)
- **Extension Chrome** : React + Vite + SCSS, communication avec `background.ts`
- **ORM** : Sequelize
- **Hébergement** : Fly.io / Vercel

---

## 📦 Fonctionnalités principales

### 🔐 Authentification
- Création, connexion, mot de passe oublié.
- Système Remember Me → refreshToken via cookies (web) ou `chrome.storage.local` (extension).
- Redirection dynamique selon rôle : `user` ou `brand`.

### 🐞 Signalements
- Signalement d’un bug via sélection + capture d’écran.
- Détection automatique : domaine, emplacement du bug, catégories.
- Vérifie si un signalement similaire existe déjà.
- Permet à d’autres utilisateurs de confirmer un bug existant.

### 💡 Suggestions & ❤️ Coups de Cœur
- Système de feedback léger, sans capture.
- Popup des derniers retours utilisateurs sur une page.
- Like & Reactions via emojis.

### ✨ Extension Chrome Usearly
- Menu flottant déclenché par triple-clic ou raccourci clavier.
- Système de capture + surcouche d’annotation.
- Rendu dynamique des signalements/suggestions existants.
- Réactions animées + gamification.

### ⚙️ Gamification
- Points gagnés à chaque action.
- Badges, classement, système de confirmation.

---

## 🧪 Sécurité
- Protection CSRF côté API (activée uniquement en production).
- Headers sécurisés (`SameSite=None`, `secure=true`).
- Token d’accès limité à 24h, token de rafraîchissement à 30 jours.

---

## 📁 Structure du projet

```bash
├── models/                # Modèles Sequelize (User, Post, Like, Suggestion, etc.)
├── routes/                # Contrôleurs et endpoints Express
├── services/              # Fonctions métier (analyse d’URL, suggestions, etc.)
├── middlewares/          # Auth, CSRF, Rate Limiting, etc.
├── utils/                # Fonctions utilitaires : JWT, validations, etc.
├── migrations/           # Migrations Sequelize
├── public/uploads/       # Avatars / captures
├── .env                  # Variables d’environnement (clé secrète, DB, etc.)
└── app.js                # Point d’entrée Express

