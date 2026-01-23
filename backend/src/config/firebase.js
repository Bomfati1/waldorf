const admin = require("firebase-admin");

// Validação das variáveis de ambiente
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error(
    "FIREBASE_PROJECT_ID não está definido nas variáveis de ambiente",
  );
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error(
    "FIREBASE_CLIENT_EMAIL não está definido nas variáveis de ambiente",
  );
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error(
    "FIREBASE_PRIVATE_KEY não está definido nas variáveis de ambiente",
  );
}

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Corrige a formatação da chave privada vinda do .env
  // Remove quebras de linha duplas e substitui \n por quebras de linha reais
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "",
};

// Obtém o nome do bucket do .env ou usa o padrão
// Remove o prefixo gs:// se presente
let bucketName =
  process.env.FIREBASE_STORAGE_BUCKET ||
  `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
if (bucketName && bucketName.startsWith("gs://")) {
  bucketName = bucketName.replace("gs://", "");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    // Define o storageBucket corretamente com o endereço do bucket (sem prefixo gs://)
    storageBucket: bucketName,
  });
}

// Obtém o bucket específico pelo nome
const bucket = admin.storage().bucket(bucketName);

console.log(`✅ Firebase Admin SDK configurado com bucket: ${bucketName}`);

module.exports = { bucket, admin };
