
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Entrez le mot de passe à hacher : ', async (password) => {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\nHash généré :');
    console.log(hash);
  } catch (error) {
    console.error('Erreur lors de la génération du hash.');
    process.exitCode = 1;
  } finally {
    rl.close();
  }
});
