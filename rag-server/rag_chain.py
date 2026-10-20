
import os
from dotenv import load_dotenv

from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.chains import RetrievalQA
import numpy as np
from langchain.prompts import PromptTemplate
from text_preprocessing import (
    clean_and_lemmatize,
    contains_sensitive_keyword,
    sensitive_keywords,
)
from langchain.schema import Document
import psycopg2

# Charger les variables depuis rag-server/.env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


### 1. Fonctions pour charger les intentions et les mots sensibles

def get_pg_connection():
    """Créer une connexion PostgreSQL avec les variables d'environnement."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        dbname=os.getenv("DB_NAME", "chatbot_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.environ["DB_PASSWORD"],
    )


def load_intentions_from_pg():
    conn = get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT keyword, response, link FROM intentions_RAG")
        rows = cur.fetchall()
        cur.close()

        docs = []
        for keyword, response, link in rows:
            full_text = f"{keyword}. Réponse : {response}"
            if link:
                full_text += f" Lien : {link}"

            cleaned_text = clean_and_lemmatize(full_text)
            docs.append(
                Document(
                    page_content=cleaned_text,
                    metadata={
                        "question": keyword,
                        "response": response,
                        "link": link,
                    },
                )
            )

        return docs
    finally:
        conn.close()


def load_sensitive_words():
    conn = get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT word FROM sensitive_words")
        rows = cur.fetchall()
        cur.close()
        return [row[0] for row in rows]
    finally:
        conn.close()


### 2. Charger les données depuis PostgreSQL

documents = load_intentions_from_pg()
sensitive_keywords = load_sensitive_words()


### 3. Vectorisation

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.from_documents(documents, embeddings)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3},
)

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
)


### 4. Initialiser le modèle de langage

llm = Ollama(model="mistral")

rag_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
Tu es un assistant virtuel spécialisé uniquement en assurance.

Interdiction absolue : ne parle jamais d'immigration, de visa ou de
nationalité. Si une question concerne ces sujets, réponds :
"Je suis un assistant spécialisé en assurance automobile et habitation.
Je ne peux pas répondre à cette question."

Ta mission : réponds toujours en français correct, clair et professionnel.
Utilise le contexte et l'historique de la conversation pour répondre
naturellement. Si aucun lien n'existe dans le contexte, ne mentionne pas
de lien. Si le contexte contient un lien, affiche son URL complète.

Voici le contexte : {context}

Question : {question}

Réponse en français :
""",
)

prompt_template = PromptTemplate(
    input_variables=["question"],
    template=(
        "Tu es un assistant assurance parlant uniquement en français. "
        "Réponds clairement et poliment à la question suivante : {question}"
    ),
)

qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
    combine_docs_chain_kwargs={"prompt": rag_prompt},
)


### 5. Fonction principale ask()

def ask(question):
    global retriever, llm, rag_prompt, memory

    print("Nouvelle requête utilisateur reçue")
    print(f"Question originale : {question}")

    question_clean = clean_and_lemmatize(question)
    print(f"Question nettoyée et lemmatisée : {question_clean}")

    if contains_sensitive_keyword(question_clean, sensitive_keywords):
        print("Mot sensible détecté")
        return (
            "Je ne peux pas répondre à cette question actuellement. "
            "Veuillez contacter votre agence."
        )

    relevant_docs = retriever.get_relevant_documents(question)
    print(f"Documents similaires récupérés : {len(relevant_docs)}")

    for idx, doc in enumerate(relevant_docs, 1):
        print(f"Document {idx} : {doc.page_content}")

    if not relevant_docs:
        return (
            "Je suis désolé, je n'ai pas trouvé d'information "
            "correspondante à votre question. Veuillez contacter votre agence."
        )

    # Créer une chaîne de conversation pour la requête
    current_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        combine_docs_chain_kwargs={"prompt": rag_prompt},
    )

    result = current_chain({"question": question})
    response = result["answer"]

    # Gérer le lien uniquement s'il existe dans la base
    top_doc = relevant_docs[0]
    link = top_doc.metadata.get("link")

    print(f"Lien récupéré depuis la base : {link}")

    if link and str(link).strip().lower() != "null":
        clean_link = str(link).strip().rstrip(">").rstrip("%3E")
        print(f"Lien nettoyé : {clean_link}")
    else:
        import re

        response = re.sub(
            r"\b(link|lien)\b",
            "",
            response,
            flags=re.IGNORECASE,
        ).strip()

    print(f"Réponse finale : {response}")
    return response
