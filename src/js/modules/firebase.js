import * as FirebaseApp from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import * as FirebaseAuth from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import * as FirebaseFirestore from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export const App = FirebaseApp;
export const Auth = FirebaseAuth;
const Firestore = FirebaseFirestore;
const { doc, getDoc, updateDoc, setDoc } = Firestore;

export const config = {
  apiKey: "AIzaSyAQzus3jpjO5ROeH5l4Aq2N6FmaCSVzL7M",
  authDomain: "allos-4b301.firebaseapp.com",
  projectId: "allos-4b301",
  storageBucket: "allos-4b301.firebasestorage.app",
  messagingSenderId: "575700101075",
  appId: "1:575700101075:web:1e989d95795cbfa2fef126",
  measurementId: "G-MND68E4P69",
};

let app;
let auth;
let db;

const getApp = () => {
  if (!app) {
    app = App.initializeApp(config);
  }
  return app;
};

export const getAuthInstance = () => {
  if (auth) {
    return auth;
  }
  auth = Auth.getAuth(getApp());
  return auth;
};

const getDbInstance = () => {
  if (db) {
    return db;
  }
  db = Firestore.getFirestore(getApp());
  return db;
};

/**
 * Create a user profile document if it doesn't exist yet.
 * Initializes with the user's UID.
 */
export const ensureUserProfile = async (user) => {
  if (!user?.uid) {
    return;
  }

  const db = getDbInstance();
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    try {
      await setDoc(docRef, {
        uid: user.uid,
      });
    } catch (error) {
      console.error("Failed to create user profile:", error);
    }
  }
};

export const getUserRole = async (user) => {
  if (!user?.uid) {
    return null;
  }
  const db = getDbInstance();
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return docSnap.data().user_role ?? null;
};

/**
 * Set the subgroup field on the user's profile document.
 * Only sets if the value is provided and subgroup is not already set.
 */
export const setUserSubgroup = async (user, subgroupValue) => {
  if (!user?.uid || !subgroupValue) {
    return;
  }

  const db = getDbInstance();
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return;
  }

  const userData = docSnap.data();

  if (userData.user_role === "internal") {
    return;
  }

  // Only set subgroup if it's not already set
  if (!userData.subgroup) {
    try {
      await updateDoc(docRef, {
        subgroup: subgroupValue,
      });
    } catch (error) {
      console.error("Failed to set user subgroup:", error);
    }
  }
};
