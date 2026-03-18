// ===== FIREBASE CONFIGURATION =====
// Substitua com suas credenciais do Firebase Console
// https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyDsEK4RY_5Q0pBDkPC16mLYP5SgNdqBswc",
    authDomain: "dasiboard.firebaseapp.com",
    projectId: "dasiboard",
    storageBucket: "dasiboard.firebasestorage.app",
    messagingSenderId: "946586942129",
    appId: "1:946586942129:web:2071934f38d1dad333c090",
    measurementId: "G-TL1PB8NYTS"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistência
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch(err => console.error('Persistência não configurada:', err));
