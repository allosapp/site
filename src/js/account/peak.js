import { storageKeys } from "../modules/constants.js";
import {
  config as firebaseConfig,
} from "../modules/firebase.js";
import { runOnLoad } from "../modules/util.js";

const utm_campaign = "partner_peak";
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
      localStorage.setItem(storageKeys.utmCampaign, utm_campaign);
      window.location.replace("/account/profile");
    }
  });

  ui.start("#firebaseui-auth-container", {
    signInFlow: "popup",
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      {
        provider: "apple.com",
      },
    ],
    callbacks: {
      signInSuccessWithAuthResult: function() {
        localStorage.setItem(storageKeys.utmCampaign, utm_campaign);
        window.location.replace("/account/profile/");
        return false;
      },
    },
  });
});
