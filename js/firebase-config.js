// js/firebase-config.js
// ============================================
// KONFIGURASI FIREBASE - TANPA ES MODULES
// SMK TI Bali Global Karangasem
// ============================================

// Inisialisasi Firebase menggunakan CDN (sudah include di HTML)
// Jadi file ini hanya untuk konfigurasi global

// Konfigurasi Firebase
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
firebase.initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = firebase.firestore();

// Inisialisasi Auth
const auth = firebase.auth();

console.log('Firebase berhasil diinisialisasi');
