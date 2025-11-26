import {
  config as firebaseConfig,
} from "../modules/firebase.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  /**
   * This page uses global firebase and firebaseui objects defined globally via imported scripts in the HTML file,
   * because FirebaseUI does not yet work with the modular Firebase packages.
   */
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const ui = new firebaseui.auth.AuthUI(auth);

  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.replace("/account/profile");
    }
  });

  ui.start("#firebaseui-auth-container", {
    // Using 'popup' flow for now, because 'redirect' flow does not successfully register that the user has
    // signed in after successfully completing a third-party sign-in flow.
    signInFlow: "popup",
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      {
        provider: "apple.com",
      },
    ],
    signInSuccessUrl: "/account/profile/",
  });
});
