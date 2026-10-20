// backend/callLLM.js
const axios = require('axios');

async function callLLM(question) {
  try {
    const response = await axios.post('http://localhost:5000/api/rag', { question });
    return response.data.reply;
  } catch (error) {
    console.error('Erreur LLM RAG:', error);
    return "Je n’ai pas pu trouver une réponse précise.";
  }
}

module.exports = callLLM;
