import { Auth, getAuthInstance } from "../modules/firebase.js";
import { subscribeEmailToMailingList } from "../modules/kit.js";
import { getUserDisplayName, runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  const auth = getAuthInstance();

  Auth.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("/account/sign-in/");
      return;
    }

    if (!user.emailVerified) {
      window.location.replace("/account/profile/");
      return;
    }

    await subscribeEmailToMailingList({
      email: user.email,
      name: getUserDisplayName(user),
    });
  });
});
