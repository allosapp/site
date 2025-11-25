import { config as firebaseConfig, onUserChanged } from "../modules/firebase.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const ui = new firebaseui.auth.AuthUI(auth);

  onUserChanged((user) => {
    if (user) {
      window.location.replace("/account/profile")
    }
  })

  ui.start("#firebaseui-auth-container", {
    signInSuccessUrl: "/account/profile",
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      {
        provider: "apple.com",
      },
    ],
  });
});
