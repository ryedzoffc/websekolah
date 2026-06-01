// js/firebase-config.js
// ============================================
// KONFIGURASI FIREBASE
// SMK TI Bali Global Karangasem
// ============================================

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyBMdBOguRVd02u79idp4xAoTfjDy-h28EQ",
    authDomain: "osisedimahendra.firebaseapp.com",
    projectId: "osisedimahendra",
    storageBucket: "osisedimahendra.firebasestorage.app",
    messagingSenderId: "382159139986",
    appId: "1:382159139986:web:f33b3470b1136ccf50a24b",
    measurementId: "G-T7ESGSCSGQ"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = getFirestore(app);

// Inisialisasi Authentication
const auth = getAuth(app);

// Export untuk digunakan di file lain
export { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged };
