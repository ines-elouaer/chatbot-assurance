# Chatbot d'Assurance : Plateforme d'assistance intelligente en assurance

Un assistant conversationnel full-stack pour une compagnie d'assurance. Il combine une **classification d'intention par LLM** et un pipeline de **génération augmentée par récupération (RAG)** sur une base de connaissances FAQ d'assurance, au sein d'une application web à rôles (client, agent, administrateur).

Projet de stage de fin de 2ème année du cycle ingénieur (Data Science).

![Capture du chatbot](docs/screenshots/chatbot.png)

## Table des matières

1. [Fonctionnalités](#fonctionnalités)
2. [Architecture](#architecture)
3. [Technologies](#technologies)
4. [Structure du projet](#structure-du-projet)
5. [Démarrage](#démarrage)
6. [Variables d'environnement](#variables-denvironnement)
7. [Aperçu de l'API](#aperçu-de-lapi)
8. [Pipeline IA : méthodologie](#pipeline-ia--méthodologie)
9. [Captures d'écran](#captures-décran)
10. [Sécurité](#sécurité)
11. [Limites et feuille de route](#limites-et-feuille-de-route)
12. [Auteure](#auteure)

## Fonctionnalités

**Client**
- Interface de discussion avec saisie texte et vocale
- Réponses immédiates sur l'assurance auto et habitation (contrats, paiement, sinistres, carte verte, espace client)
- Historique personnel des conversations avec filtres par date et pagination

**Agent**
- Tableau de statistiques : nombre de clients, questions les plus fréquentes, évolution des questions dans le temps
- Détection et liste des mots sensibles présents dans les conversations
- Consultation de l'historique des conversations des clients

**Administrateur**
- Gestion des intentions : ajout, modification et suppression des entrées question / réponse / lien de la base de connaissances
- Gestion des mots sensibles
- Historique complet des messages filtrable par agent, client et période

**Plateforme**
- Authentification JWT et contrôle d'accès par rôle
- Architecture modulaire en microservices (frontend, backend, NLP, RAG)
- Conversations stockées dans PostgreSQL



| Composant | Rôle | Technologie | Port par défaut |
|---|---|---|---|
| `front-assurance` | Interface utilisateur, écrans par rôle | Angular, TypeScript, SCSS | 4200 |
| `backend` | API REST, authentification, routage des messages, accès à la base | Node.js, Express, PostgreSQL, JWT | voir `.env` |
| `nlp-server` | Classification d'intention et réponses courtes via LLM | Python, Flask, Ollama (Mistral) | 5005 |
| `rag-server` | Recherche documentaire et génération de réponses | Python, Flask, LangChain, FAISS, Ollama | 5000 |

### Déroulement d'une requête

1. L'utilisateur envoie un message depuis l'interface Angular.
2. Le backend authentifie la requête et route le message.
3. Le **service NLP** classifie l'intention (salutation, déclarer un sinistre, remboursement, indemnisation, paiement, contrat, carte).
4. Pour les questions de fond, le **service RAG** récupère les passages de FAQ les plus pertinents et génère une réponse fondée sur eux.
5. Le backend enregistre l'échange dans PostgreSQL et renvoie la réponse à l'utilisateur.

## Technologies

- **Frontend :** Angular, TypeScript, HTML5, SCSS
- **Backend :** Node.js, Express, PostgreSQL, JWT
- **IA / NLP :** Python, Flask, LangChain, FAISS, Ollama, Mistral, nettoyage et lemmatisation de texte
- **Outils :** Git, GitHub, npm, pgAdmin, Visual Studio Code

## Structure du projet

```text
chatbot-assurance/
├── backend/
│   ├── callLLM.js
│   ├── db.js
│   ├── generate-hash.js        # utilitaire de hachage de mot de passe
│   ├── messageRouter.js
│   ├── server.js
│   ├── db/
│   │   ├── schema.sql          # structure de la base
│   │   └── seed.sql            # données de démonstration fictives
│   ├── .env.example
│   └── package.json
├── front-assurance/            # application Angular
├── nlp-server/
│   └── app.py                  # service de classification d'intention
├── rag-server/
│   ├── app.py                  # API RAG
│   ├── rag_chain.py            # chaîne de recherche + génération
│   ├── text_preprocessing.py   # nettoyage / lemmatisation
│   ├── docs/faq_assurance.txt  # base de connaissances FAQ
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Démarrage

### Prérequis

- Node.js 18+ et npm
- Python 3.11+
- PostgreSQL 14+ (pgAdmin facultatif)
- [Ollama](https://ollama.com) installé et lancé
- Git

### 1. Cloner le dépôt

```bash
git clone https://github.com/ines-elouaer/chatbot-assurance.git
cd chatbot-assurance
```

### 2. Télécharger le modèle de langage

```bash
ollama pull mistral
```

### 3. Préparer la base de données

```bash
createdb chatbot_assurance
psql -d chatbot_assurance -f backend/db/schema.sql
psql -d chatbot_assurance -f backend/db/seed.sql
```

### 4. Lancer le backend

```bash
cd backend
cp .env.example .env        # puis modifier les valeurs
npm install
npm start
```

### 5. Lancer le service NLP

```bash
cd nlp-server
python -m venv venv
source venv/bin/activate     # Windows : venv\Scripts\activate
pip install flask requests
python app.py                # démarre sur http://localhost:5005
```

### 6. Lancer le service RAG

```bash
cd rag-server
python -m venv venv
source venv/bin/activate     # Windows : venv\Scripts\activate
pip install -r requirements.txt
python app.py                # démarre sur http://localhost:5000
```

Après modification de la base de connaissances, reconstruire l'index :

```bash
curl -X POST http://localhost:5000/api/reload
```

### 7. Lancer le frontend

```bash
cd front-assurance
npm install
ng serve                     # démarre sur http://localhost:4200
```

### Comptes de démonstration

Les comptes sont créés par `backend/db/seed.sql`. Utilisez `generate-hash.js` pour générer le hash d'un nouveau mot de passe :

```bash
node backend/generate-hash.js
```

## Variables d'environnement

Ne committez jamais le vrai fichier `.env`. Copiez `.env.example` et renseignez vos propres valeurs.

**backend/.env**

| Variable | Description |
|---|---|
| `PORT` | Port du backend |
| `DB_HOST`, `DB_PORT` | Hôte et port de PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Identifiants de la base |
| `JWT_SECRET` | Secret de signature des tokens |
| `NLP_URL` | URL du service NLP (ex. `http://localhost:5005`) |
| `RAG_URL` | URL du service RAG (ex. `http://localhost:5000`) |
| `FRONTEND_URL` | URL publique du frontend utilisée dans les liens générés |

**rag-server / nlp-server**

| Variable | Description |
|---|---|
| `OLLAMA_URL` | Serveur Ollama (par défaut `http://localhost:11434`) |
| `LLM_MODEL` | Modèle de génération (par défaut `mistral`) |
| `EMBEDDING_MODEL` | Modèle d'embeddings (ex. `nomic-embed-text`) |

## Aperçu de l'API

| Service | Méthode | Endpoint | Description |
|---|---|---|---|
| NLP | POST | `/predict` | Corps `{"message": "..."}`, renvoie `{"intent": "...", "reply": "..."}` |
| RAG | POST | `/api/rag` | Corps `{"question": "..."}`, renvoie `{"reply": "..."}` |
| RAG | POST | `/api/reload` | Recharge les documents et reconstruit l'index FAISS |

Les endpoints du backend (authentification, messages, intentions, mots sensibles, statistiques) sont définis dans `backend/server.js` et `backend/messageRouter.js`.

## Pipeline IA : méthodologie

**1. Classification d'intention (`nlp-server`)**
Le message de l'utilisateur est envoyé à Mistral (servi par Ollama) avec un prompt contraint qui impose une sortie JSON stricte contenant une `intent` parmi une liste fixe et une courte `reply`. Un mécanisme de secours gère les JSON mal formés et les erreurs du LLM.

**2. Génération augmentée par récupération (`rag-server`)**
- Le fichier FAQ est découpé en chunks (500 caractères, 50 de chevauchement).
- Les chunks sont nettoyés et vectorisés, puis indexés dans FAISS.
- À la question, les chunks les plus similaires sont récupérés et transmis à Mistral pour générer une réponse fondée sur eux.
- L'index peut être reconstruit sans redémarrer le service grâce à `/api/reload`.

**3. Évaluation**
*À compléter :* décrivez votre jeu de test (nombre de questions), les métriques utilisées (par exemple taux de retrouvailles du bon passage, justesse des réponses évaluée manuellement, précision de l'intention) et les résultats.

## Captures d'écran

| Chatbot | Historique des conversations |
|---|---|
| ![Chatbot](docs/screenshots/chatbot.png) | ![Historique](docs/screenshots/history.png) |

| Tableau de bord administrateur | Gestion des intentions |
|---|---|
| ![Admin](docs/screenshots/admin-dashboard.png) | ![Intentions](docs/screenshots/intents.png) |

| Statistiques agent | Historique complet des messages |
|---|---|
| ![Statistiques](docs/screenshots/stats.png) | ![Historique complet](docs/screenshots/full-history.png) |

## Sécurité

- Les secrets et identifiants sont chargés depuis des variables d'environnement et exclus du contrôle de version.
- Les mots de passe sont stockés hachés ; l'authentification repose sur JWT.
- L'accès aux écrans agent et administrateur est restreint par rôle.
- Les données de démonstration de ce dépôt sont fictives.
- En production : utiliser un gestionnaire de secrets, HTTPS et des comptes de base de données à privilèges minimaux.

## Limites et feuille de route

- [ ] Tests automatisés (backend, services Python, Angular)
- [ ] Évaluation systématique de la qualité de la recherche et des réponses
- [ ] Docker Compose pour lancer tous les services en une commande
- [ ] Pipeline CI (lint et tests) avec GitHub Actions
- [ ] Journalisation structurée et supervision
- [ ] Documentation complète de l'API (OpenAPI / Swagger)

## Auteure

**Ines Elouaer**
Étudiante ingénieure en Data Science | IA et NLP | Applications IA full-stack

GitHub : [ines-elouaer](https://github.com/ines-elouaer)
