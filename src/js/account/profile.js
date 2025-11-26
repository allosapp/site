import { storageKeys } from "../modules/constants.js";
import { Auth, getAuthInstance } from "../modules/firebase.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  let currentUser = undefined;
  const auth = getAuthInstance();
  const elements = {
    mainContent: document.getElementById("main-content"),
    resendEmailButton: document.getElementById("resend-email-btn"),
    signOutButton: document.getElementById("sign-out-btn"),
    userEmail: document.getElementById("user-email"),
    userName: document.getElementById("user-display-name"),
    userTier: document.getElementById("user-tier"),
    userVerified: document.getElementById("user-verified"),
  };

  const sendVerificationEmail = (user) => {
    window.localStorage.setItem(storageKeys.verifyEmail, user.email);
    Auth.sendEmailVerification(user);
  };

  elements.resendEmailButton.addEventListener("click", () => {
    if (currentUser) {
      sendVerificationEmail(currentUser);
    }
    elements.resendEmailButton.disabled = true;
    setTimeout(() => (elements.resendEmailButton.disabled = false), 5000);
  });

  elements.signOutButton.addEventListener("click", () => {
    if (currentUser) {
      elements.mainContent.classList.add("hidden");
      auth.signOut();
    }
    window.location.replace("/account/sign-in");
  });

  Auth.onAuthStateChanged(auth, (user) => {
    if (!user) {
      currentUser = null;
      elements.userEmail.textContent = "";
      elements.userName.textContent = "You are not signed in.";
      elements.userTier.textContent = "";
      elements.signOutButton.textContent = "Sign In";
      return;
    }

    if (!user.emailVerified) {
      // Reveal the email verification section.
      elements.userVerified.style.display = "flex";
      const cachedEmail = window.localStorage.getItem(storageKeys.verifyEmail);
      if (!cachedEmail) {
        sendVerificationEmail(user);
      }
    } else {
      // Back to the default state, which is hidden.
      elements.userVerified.style.display = "none";
    }

    elements.userEmail.textContent = user.email;
    elements.userName.textContent = user.displayName;
    elements.userTier.textContent = "Tier: Free or Premium";
    currentUser = user;
  });
});
