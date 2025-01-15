# api rest full - USEARLY_API

_(des badges sympatiques)_

[![forthebadge](https://forthebadge.com/images/badges/made-with-crayons.svg)](http://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/powered-by-electricity.svg)](https://forthebadge.com)

## Pour commencer

# API Node.js pour le Reporting

## Description

Ce projet est une API RESTful construite avec **Node.js**, **Express**, et **Sequelize**. L'objectif principal est de permettre aux utilisateurs de créer, gérer et enrichir des signalements (**"Reportings"**). L'API utilise l'intégration avec OpenAI pour analyser et enrichir les descriptions fournies par les utilisateurs.

## Fonctionnalités Principales

- **Gestion des utilisateurs :**
  - Création, authentification, mise à jour des mots de passe.
- **Signalements (Reportings) :**
  - Création de signalements avec détection de similarité via OpenAI.
  - Association de signalements existants à des descriptions multiples.
- **Suggestions et Coups de Cœur :**
  - Gestion des suggestions et coups de cœur pour chaque utilisateur.
- **Documentation :**
  - Swagger pour documenter l'API.
- **Tests :**
  - Tests unitaires et d'intégration avec Mocha, Chai, et Sinon.

## Prérequis

Avant de commencer, assurez-vous que votre machine a les éléments suivants :

- **Node.js** (v16 ou supérieur)
- **NPM** ou **Yarn**
- **MySQL** ou **SQLite** pour la base de données
- Fichier `.env` correctement configuré (voir [Configuration](#configuration))

## Installation

1. Clonez ce dépôt :

   ```bash
   git clone https://github.com/votre-utilisateur/projet-api.git
   cd projet-api
   ```

   ## lint

   ```bash
   npm run lint
   npm run format
   npx prettier --write routes/example.js
   ```
