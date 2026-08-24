import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVLFzLbEdNvTLLKAPKT0LMTLbs0-SnYts",
  authDomain: "ticketbookin-7f4d2.firebaseapp.com",
  projectId: "ticketbookin-7f4d2",
  storageBucket: "ticketbookin-7f4d2.firebasestorage.app",
  messagingSenderId: "436443010520",
  appId: "1:436443010520:web:fda01b34f272820c96cead",
  measurementId: "G-3VWD226Z3T"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
