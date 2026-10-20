# Chatbot d'Assurance : plateforme d'assistance intelligente

Assistant conversationnel full-stack pour une compagnie d'assurance automobile et habitation. Il combine une **classification d'intention par LLM** et un pipeline de **génération augmentée par récupération (RAG)** alimenté par une base de connaissances gérée dans PostgreSQL, au sein d'une application web à trois rôles : client, agent et administrateur.

Projet de stage de fin de 2ème année du cycle ingénieur (Data Science).

## Fonctionnalités

**Client**
- Discussion avec le chatbot par texte ou par saisie vocale
- Réponses sur l'assurance auto et habitation (contrats, paiement, sinistres, carte verte, espace client)
- Historique personnel des conversations, filtrable par date, avec pagination

**Agent**
- Statistiques par période : nombre de clients, questions les plus posées, évolution des questions
- Liste des mots sensibles détectés dans les conversations
- Consultation de l'historique des messages des clients

**Administrateur**
- Gestion des intentions : ajout, modification et suppression des entrées question / réponse / lien utilisées par le RAG
- Gestion des mots sensibles
- Historique complet des messages, filtrable par agent, client et période

**Plateforme**
- Authentification JWT, mots de passe hachés avec bcrypt, accès aux écrans selon le rôle
- Architecture en services séparés : frontend, backend, service NLP, service RAG
- Conversations et base de connaissances stockées dans PostgreSQL


| Composant | Rôle | Technologies |
|---|---|---|
| `front-assurance` | Interface utilisateur, écrans par rôle | Angular, TypeScript, SCSS |
| `backend` | API REST, authentification, orchestration des appels aux services, accès à la base | Node.js, Express, PostgreSQL, JWT, bcrypt |
| `nlp-server` | Classification d'intention et réponse courte | Python, Flask, Ollama (Mistral) |
| `rag-server` | Recherche dans la base de connaissances et génération de la réponse | Python, Flask, LangChain, FAISS, Sentence-Transformers, spaCy, Ollama (Mistral) |

Le backend reçoit les messages du frontend, appelle les services NLP et RAG et enregistre les échanges dans PostgreSQL (voir `backend/messageRouter.js`).

## Pipeline IA

**Classification d'intention (`nlp-server`)**
Le message est envoyé à Mistral (servi par Ollama) avec un prompt qui impose une sortie JSON stricte : une `intent` parmi `bonjour`, `déclarer`, `rembourser`, `indemniser`, `payer`, `contrat`, `carte`, et une courte `reply`. Si le JSON est invalide ou si le LLM échoue, un mécanisme de secours renvoie le texte brut ou un message d'erreur.

**RAG (`rag-server`)**
1. Les intentions (`keyword`, `response`, `link`) sont lues dans la table PostgreSQL `intentions_RAG`.
2. Chaque entrée est nettoyée (minuscules, suppression des accents, lemmatisation avec spaCy `fr_core_news_md`).
3. Les textes sont vectorisés avec `sentence-transformers/all-MiniLM-L6-v2` et indexés dans FAISS.
4. À chaque question, les 3 passages les plus proches sont récupérés et transmis à Mistral, qui rédige la réponse avec l'historique de la conversation (`ConversationalRetrievalChain`).
5. Le lien associé à l'entrée la plus proche n'est conservé que s'il existe en base.

**Filtrage des mots sensibles**
Avant toute recherche, la question est comparée à la liste de la table `sensitive_words`. En cas de correspondance, le bot ne répond pas et invite le client à contacter son agence. La liste est modifiable depuis l'écran administrateur.

## Structure du projet

```text
chatbot-assurance/
├── backend/
│   ├── callLLM.js
│   ├── db.js
│   ├── generate-hash.js        # génère le hash bcrypt d'un mot de passe
│   ├── messageRouter.js
│   ├── server.js
│   ├── db/schema.sql           # structure de la base
│   └── .env.example
├── front-assurance/            # application Angular
├── nlp-server/
│   └── app.py
├── rag-server/
│   ├── app.py
│   ├── rag_chain.py
│   ├── text_preprocessing.py
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Installation

### Prérequis

- Node.js et npm
- Python 3.11 ou compatible
- PostgreSQL
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

### 3. Créer la base de données

```bash
createdb chatbot_db
psql -d chatbot_db -f backend/db/schema.sql
```

La base contient notamment les tables `users`, `intentions_RAG` et `sensitive_words`, ainsi que les tables de messages.

### 4. Backend

```bash
cd backend
cp .env.example .env     # puis renseigner les valeurs
npm install
node server.js
```

### 5. Service NLP

```bash
cd nlp-server
pip install flask requests
python app.py            # http://localhost:5005
```

### 6. Service RAG

```bash
cd rag-server
cp .env.example .env     # puis renseigner les valeurs
pip install -r requirements.txt
python -m spacy download fr_core_news_md
python app.py            # http://localhost:5000
```

### 7. Frontend

```bash
cd front-assurance
npm install
ng serve                 # http://localhost:4200
```

### Créer un compte

Générez le hash d'un mot de passe, puis insérez l'utilisateur dans la table `users` (`username`, `password`, `role`, `region`, `agent_id`) ou utilisez la route d'inscription du backend :

```bash
node backend/generate-hash.js
```

Les rôles disponibles sont `client`, `agent` et `admin`.

## Variables d'environnement

Le vrai fichier `.env` ne doit jamais être committé : copiez `.env.example` et renseignez vos valeurs.

| Variable | Utilisée par | Description |
|---|---|---|
| `DB_HOST` | backend, rag-server | Hôte PostgreSQL (défaut `localhost`) |
| `DB_NAME` | backend, rag-server | Nom de la base (défaut `chatbot_db`) |
| `DB_USER` | backend, rag-server | Utilisateur PostgreSQL (défaut `postgres`) |
| `DB_PASSWORD` | backend, rag-server | Mot de passe PostgreSQL |
| `JWT_SECRET` | backend | Clé de signature des tokens JWT (le serveur refuse de démarrer sans elle) |

## API des services Python

| Service | Méthode | Route | Description |
|---|---|---|---|
| NLP | POST | `/predict` | Corps `{"message": "..."}`, renvoie `{"intent": "...", "reply": "..."}` |
| RAG | POST | `/api/rag` | Corps `{"question": "..."}`, renvoie `{"reply": "..."}` |

Les routes du backend (authentification, messages, intentions, mots sensibles, statistiques) sont définies dans `backend/server.js` et `backend/messageRouter.js`.

## Sécurité

- Les secrets sont lus depuis des variables d'environnement et exclus du dépôt.
- Les mots de passe sont stockés hachés avec bcrypt ; l'authentification repose sur des tokens JWT.
- L'accès aux écrans agent et administrateur dépend du rôle.
- En production : gestionnaire de secrets, HTTPS et comptes de base de données à privilèges minimaux.

## Pistes d'amélioration

- [ ] Tests automatisés (backend, services Python, Angular)
- [ ] Évaluation chiffrée de la qualité de la recherche et des réponses
- [ ] Docker Compose pour lancer tous les services
- [ ] Intégration continue avec GitHub Actions
- [ ] Journalisation structurée
- [ ] Documentation complète de l'API

## Auteure

**Ines Elouaer**, étudiante ingénieure en Data Science | IA et NLP | Applications IA full-stack

GitHub : [ines-elouaer](https://github.com/ines-elouaer)
