import { storageKeys } from "../modules/constants.js";
import { Auth, getAuthInstance, getUserRole } from "../modules/firebase.js";
import {
  getUserHasPremiumSub,
  setUserAttributes,
} from "../modules/revcat.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  let currentUser = undefined;
  let userRole = undefined;
  let subscriptionActive = false;
  let isLoading = true;
  const auth = getAuthInstance();
  const elements = {
    loadingContainer: document.getElementById("loading-container"),
    mainContent: document.getElementById("main-content"),
    resendEmailButton: document.getElementById("resend-email-btn"),
    signOutButton: document.getElementById("sign-out-btn"),
    userEmail: document.getElementById("user-email"),
    userName: document.getElementById("user-display-name"),
    userSubscribe: document.getElementById("user-subscribe"),
    userSubscribeLink: document.querySelector("#user-subscribe a"),
    userTier: document.getElementById("user-tier"),
    userVerify: document.getElementById("user-verify"),
    verifyEmailAddress: document.getElementById("verify-email-address"),
  };

  const userIsPremium = () => {
    return userRole === "internal" || userRole === "demo" || subscriptionActive;
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
    window.localStorage.removeItem(storageKeys.verifyEmail);
    window.localStorage.removeItem(storageKeys.purchaseEmail);
    window.location.replace("/account/sign-in");
  });

  const render = () => {
    const isPremium = userIsPremium();

    if (isLoading) {
      return;
    } else {
      elements.loadingContainer.classList.add("invisible");
    }

    if (!currentUser) {
      elements.userVerify.classList.add("invisible");
      elements.mainContent.classList.remove("invisible");
      elements.userEmail.textContent = "";
      elements.userName.textContent = "You are not signed in.";
      elements.userTier.textContent = "";
      elements.userSubscribe.style.display = "none";
      elements.signOutButton.textContent = "Sign In";
      return;
    }

    if (!currentUser.emailVerified) {
      elements.mainContent.classList.add("invisible");
      elements.userVerify.classList.remove("invisible");
      elements.verifyEmailAddress.textContent = currentUser.email;
      return;
    }

    elements.userVerify.classList.add("invisible");
    elements.mainContent.classList.remove("invisible");
    elements.userEmail.textContent = currentUser.email;
    elements.userName.textContent = currentUser.displayName;
    elements.userTier.textContent = `Subscription: ${
      isPremium ? "Allos Premium" : "Allos Free"
    }`;
    elements.userSubscribe.style.display = isPremium ? "none" : "block";
    elements.signOutButton.textContent = "Sign Out";
  };

  const hideLoading = () => {
    if (isLoading) {
      setTimeout(() => {
        isLoading = false;
        render();
      }, 500);
    }
  };

  Auth.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      userRole = null;
      subscriptionActive = false;
      hideLoading();
      render();
      return;
    }

    if (!user.emailVerified) {
      const cachedEmail = window.localStorage.getItem(storageKeys.verifyEmail);
      if (!cachedEmail) {
        sendVerificationEmail(user);
      }
    }

    currentUser = user;
    userRole = await getUserRole(user);
    subscriptionActive = await getUserHasPremiumSub(user?.uid);
    await setUserAttributes(user);

    const forwardedEmail = window.localStorage.getItem(storageKeys.purchaseEmail);
    if (user.emailVerified && !userIsPremium() && forwardedEmail !== user.email) {
      // User is verified and not yet subscribed, and we haven't auto-forwarded this user yet.
      // Send the user to the purchase page.
      window.localStorage.setItem(storageKeys.purchaseEmail, user.email);
      window.location.assign("/account/purchase/");
      return;
    }

    hideLoading();
    render();
  });

  const recheckPremiumSub = async () => {
    if (!currentUser) {
      return;
    }
    const hasSub = await getUserHasPremiumSub(currentUser?.uid);
    if (subscriptionActive !== hasSub) {
      subscriptionActive = hasSub;
      render();
    }
  };

  // Refresh subscription status when window gains focus
  // (e.g., user returns from payment page in another tab)
  window.addEventListener("focus", recheckPremiumSub);

  // Refresh subscription status when page becomes visible
  // (e.g., user switches back to this tab)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      recheckPremiumSub();
    }
  });
});
