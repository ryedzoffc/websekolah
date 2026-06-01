// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBMdBOguRVd02u79idp4xAoTfjDy-h28EQ",
    authDomain: "osisedimahendra.firebaseapp.com",
    projectId: "osisedimahendra",
    storageBucket: "osisedimahendra.firebasestorage.app",
    messagingSenderId: "382159139986",
    appId: "1:382159139986:web:f33b3470b1136ccf50a24b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

console.log('✅ Firebase ready');
