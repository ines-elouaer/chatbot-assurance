const pool = require('./db');
const fetch = require('node-fetch');

const callLLM = require('./callLLM');

async function messageRouter(userMessage) {
  try {
    console.log("ðŸ§  Envoi au moteur RAG...");
    const reply = await callLLM(userMessage);
    console.log("âœ… RÃ©ponse RAG:", reply);

    return {
      reply,
      source: "rag",
    };

  } catch (error) {
    console.error('âŒ Erreur dans messageRouter:', error);
    return {
      reply: "Je ne peux pas rÃ©pondre pour le moment.",
      source: "error",
    };
  }
}







module.exports = messageRouter;
