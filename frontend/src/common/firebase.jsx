// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
//
// import firebase from 'firebase/app';
import 'firebase/storage';
import { getStorage } from 'firebase/storage';
//
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBn0sadG7m5O1rGkwLM8GKdKrkbfUmhAYM",
  authDomain: "reactjs-blog-89191.firebaseapp.com",
  projectId: "reactjs-blog-89191",
  storageBucket: "reactjs-blog-89191.appspot.com",
  messagingSenderId: "86680621974",
  appId: "1:86680621974:web:41382398e6ae2540e603b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//Google auth

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {

    let user = null;

    await signInWithPopup(auth, provider)
    .then((result) => {
        user =result.user
    })
    .catch((err) => {
        console.log(err);
    })

    return user;
}

const storage = getStorage(app);

export { storage };
