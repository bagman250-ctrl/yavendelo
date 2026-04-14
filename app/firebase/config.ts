import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBx1AVppnTWSwfYs4cWXUXQMHYLsf6DuME",
  authDomain: "yavendelo.firebaseapp.com",
  projectId: "yavendelo",
  storageBucket: "yavendelo.firebasestorage.app",
  messagingSenderId: "744027273671",
  appId: "1:744027273671:web:b1d9dc67cfc528e8d741e2"
};


const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
export const storage = getStorage(app);