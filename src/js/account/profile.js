import { onUserChanged, auth } from "../modules/firebase.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  let currentUser = undefined;
  const elements = {
    mainContent: document.getElementById("main-content"),
    userEmail: document.getElementById("user-email"),
    userName: document.getElementById("user-display-name"),
    userTier: document.getElementById("user-tier"),
    userVerified: document.getElementById("user-verified"),
    signOutButton: document.getElementById("sign-out-button"),
  };

  elements.signOutButton.addEventListener("click", () => {
    if (currentUser) {
      elements.mainContent.classList.add("hidden");
      auth.signOut();
    }
    window.location.replace("/account/sign-in");
  });

  onUserChanged((user) => {
    if (!user) {
      currentUser = null;
      elements.userEmail.textContent = "";
      elements.userVerified.textContent = "";
      elements.userName.textContent = "You are not signed in.";
      elements.userTier.textContent = "";
      elements.signOutButton.textContent = "Sign In";
      return;
    }

    elements.userEmail.textContent = user.email;
    elements.userVerified.textContent = user.emailVerified
      ? ""
      : "(not verified)";
    elements.userName.textContent = user.displayName;
    elements.userTier.textContent = "Tier: Free or Premium";
    currentUser = user;
  });
});
