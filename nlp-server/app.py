from flask import Flask, request, jsonify
import psycopg2
import requests
import json

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    user_message = data.get("message", "").strip().lower()

    prompt = f"""
Tu es un assistant pour une compagnie d’assurance.

Tu dois retourner **UNIQUEMENT** un objet JSON strict, au format exact :
{{
  "intent": "MOT_CLE",
  "reply": "Réponse courte et utile"
}}

- Intent = un seul mot parmi : bonjour, déclarer, rembourser, indemniser, payer, contrat, carte
- Ne retourne **aucun texte en dehors de ce JSON**
- Ne mets pas de guillemets manquants

Exemple :
{{"intent": "carte", "reply": "Vous pouvez télécharger votre carte verte depuis l’espace client."}}

Phrase client : {user_message}
"""


    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "mistral", "prompt": prompt},
            stream=True
        )

        result = ""
        for line in response.iter_lines():
            if line:
                data = json.loads(line.decode('utf-8'))
                result += data.get("response", "")
        print("🧪 Résultat LLM brut :", result)

        try:
            parsed = json.loads(result.strip())
            intent = parsed.get("intent", "unknown").lower()
            reply = parsed.get("reply", "Je ne comprends pas.")
        except Exception as e:
            print("❌ Erreur parsing JSON:", e)
            intent = "llm"
            reply = result.strip()

    except Exception as e:
        print("❌ Erreur appel LLM:", e)
        intent = "llm"
        reply = "Erreur NLP"

    return jsonify({"intent": intent, "reply": reply})

if __name__ == '__main__':
    app.run(port=5005)