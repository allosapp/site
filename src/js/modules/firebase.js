import * as FirebaseApp from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import * as FirebaseAuth from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

export const App = FirebaseApp;
export const Auth = FirebaseAuth;

export const config = {
  apiKey: "AIzaSyAQzus3jpjO5ROeH5l4Aq2N6FmaCSVzL7M",
  authDomain: "allos-4b301.firebaseapp.com",
  projectId: "allos-4b301",
  storageBucket: "allos-4b301.firebasestorage.app",
  messagingSenderId: "575700101075",
  appId: "1:575700101075:web:1e989d95795cbfa2fef126",
  measurementId: "G-MND68E4P69",
};

export const app = App.initializeApp(config);
export const auth = Auth.getAuth(app);
export const onUserChanged = (cb) => {
  Auth.onAuthStateChanged(auth, cb);
};
