import spacy
import unicodedata
import psycopg2
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
# Charger spaCy French
nlp = spacy.load("fr_core_news_md")

# Fonction : enlever les accents
def remove_accents(text):
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )
# Fonction : lemmatiser un texte
def lemmatize(text):
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc])
# Fonction complète : clean + lower + accents + lemmatize
def clean_and_lemmatize(text):
    text = text.lower()
    text = remove_accents(text)
    text = lemmatize(text)
    return text
# Fonction : lemmatiser un texte
def lemmatize(text):
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc])

def load_sensitive_words():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        dbname=os.getenv("DB_NAME", "chatbot_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.environ["DB_PASSWORD"]
    )
    try:
        cur = conn.cursor()
        cur.execute("SELECT word FROM sensitive_words")
        rows = cur.fetchall()
        cur.close()
        return [row[0] for row in rows]
    finally:
        conn.close()
sensitive_keywords = load_sensitive_words()
def contains_sensitive_keyword(text, keywords=sensitive_keywords):
    return any(word in text for word in keywords)

# Fonction complète : clean + lower + accents + lemmatize
def clean_and_lemmatize(text):
    text = text.lower()
    text = remove_accents(text)
    text = lemmatize(text)
    return text



# ✅ AJOUT : fonction de vérification des mots-clés sensibles
def contains_sensitive_keyword(text, keywords=sensitive_keywords):
    return any(word in text for word in keywords)


