# app.py

from flask import Flask, request, jsonify
from rag_chain import ask
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.embeddings import OllamaEmbeddings
from langchain.llms import Ollama
from langchain.chains import RetrievalQA

# Assure-toi que tes variables globales existent
vectorstore = None
retriever = None
qa_chain = None
embeddings = OllamaEmbeddings(model="mistral")
llm = Ollama(model="mistral")
app = Flask(__name__)

@app.route('/api/rag', methods=['POST'])
def handle_rag():
    data = request.get_json()
    question = data.get('question', '')
    
    # Appeler la fonction RAG
    answer = ask(question)

    return jsonify({
        "reply": answer
    })

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)

@app.route('/api/reload', methods=['POST'])
def reload_rag():
    global vectorstore, retriever, qa_chain

    print("🔄 Reloading RAG...")

    # 1. Charger les documents
    loader = TextLoader("docs/faq_assurance.txt")
    documents = loader.load()

    # 2. Splitter les documents
    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = splitter.split_documents(documents)

    # 3. Nettoyer chaque chunk
    from text_preprocessing import clean_and_lemmatize
    for doc in docs:
        doc.page_content = clean_and_lemmatize(doc.page_content)

    # 4. Créer embeddings et vectorstore
    vectorstore = FAISS.from_documents(docs, embeddings)

    # 5. Créer retriever et QA chain
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 1})
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever, return_source_documents=True)

    print("✅ RAG reloaded successfully.")
    return jsonify({"message": "RAG reloaded successfully."})