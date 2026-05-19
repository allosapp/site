import { storageKeys } from "../modules/constants.js";
import {
  Auth,
  getAuthInstance,
  getUserAccessTier,
  setUserUtmCampaign,
  ensureUserProfile,
} from "../modules/firebase.js";
import { getUserHasPremiumSub, setUserAttributes } from "../modules/revcat.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  let currentUser = undefined;
  let userAccessTier = undefined;
  let subscriptionActive = false;
  let isLoading = true;
  const auth = getAuthInstance();
  const elements = {
    loadingContainer: document.getElementById("loading-container"),
    mainContent: document.getElementById("main-content"),
    resendEmailButton: document.getElementById("resend-email-btn"),
    signOutButton: document.getElementById("sign-out-btn"),
    verifySignOutButton: document.getElementById("verify-sign-out-btn"),
    userEmail: document.getElementById("user-email"),
    userName: document.getElementById("user-display-name"),
    userSubscribeBtn: document.getElementById("user-subscribe-btn"),
    userTier: document.getElementById("user-tier"),
    userVerify: document.getElementById("user-verify"),
    verifyEmailAddress: document.getElementById("verify-email-address"),
  };

  const userIsPremium = () => {
    return subscriptionActive || ["demo", "internal"].includes(userAccessTier);
  };

  const sendVerificationEmail = (user) => {
    window.localStorage.setItem(storageKeys.verifyEmail, user.email);
    Auth.sendEmailVerification(user, {
      url: `${window.location.origin}/?source=web`,
    });
  };

  const signOutAndRedirect = () => {
    if (currentUser) {
      auth.signOut();
    }
    window.localStorage.removeItem(storageKeys.verifyEmail);
    window.localStorage.removeItem(storageKeys.purchaseEmail);
    window.location.replace("/account/sign-in/");
  };

  elements.resendEmailButton.addEventListener("click", () => {
    if (currentUser) {
      sendVerificationEmail(currentUser);
    }
    elements.resendEmailButton.disabled = true;
    setTimeout(() => (elements.resendEmailButton.disabled = false), 5000);
  });

  elements.signOutButton.addEventListener("click", signOutAndRedirect);
  elements.verifySignOutButton.addEventListener("click", signOutAndRedirect);

  const render = () => {
    if (isLoading || !currentUser) {
      return;
    }
    elements.loadingContainer.classList.add("invisible");

    if (!currentUser.emailVerified) {
      elements.mainContent.classList.add("invisible");
      elements.userVerify.classList.remove("invisible");
      elements.verifyEmailAddress.textContent = currentUser.email;
      return;
    }

    const isPremium = userIsPremium();
    elements.userVerify.classList.add("invisible");
    elements.mainContent.classList.remove("invisible");
    elements.userEmail.textContent = currentUser.email;
    elements.userName.textContent = currentUser.displayName || "—";
    elements.userTier.textContent = isPremium ? "Allos Premium" : "Allos Free";
    elements.userSubscribeBtn.style.display = isPremium ? "none" : "inline-block";
  };

  Auth.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("/account/sign-in/");
      return;
    }

    if (!user.emailVerified) {
      const cachedEmail = window.localStorage.getItem(storageKeys.verifyEmail);
      if (!cachedEmail) {
        sendVerificationEmail(user);
      }
    }

    currentUser = user;

    // Ensure user profile document exists
    await ensureUserProfile(user);

    userAccessTier = await getUserAccessTier(user);
    subscriptionActive = await getUserHasPremiumSub(user?.uid);
    await setUserAttributes(user);

    // Set utmCampaign from UTM campaign if available and not already set
    const utmCampaign = localStorage.getItem(storageKeys.utmCampaign);
    if (utmCampaign) {
      await setUserUtmCampaign(user, utmCampaign);
    }

    // Post-sign-in redirect to checkout for verified, non-premium users.
    // Only fires when the user just signed in (sessionStorage flag set by sign-in.js),
    // so direct navigation to /account/profile/ never teleports the user away.
    const justSignedIn =
      sessionStorage.getItem(storageKeys.justSignedIn) === "1";
    sessionStorage.removeItem(storageKeys.justSignedIn);

    const forwardedEmail = window.localStorage.getItem(
      storageKeys.purchaseEmail,
    );
    if (
      justSignedIn &&
      user.emailVerified &&
      !userIsPremium() &&
      forwardedEmail !== user.email
    ) {
      window.localStorage.setItem(storageKeys.purchaseEmail, user.email);
      window.location.assign("/account/purchase/");
      return;
    }

    isLoading = false;
    render();
  });

  const recheckEmailVerified = async () => {
    if (!currentUser || currentUser.emailVerified) {
      return;
    }
    try {
      await Auth.reload(currentUser);
    } catch (e) {
      return;
    }
    if (currentUser.emailVerified) {
      render();
    }
  };

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

  const onFocusOrVisible = () => {
    recheckEmailVerified();
    recheckPremiumSub();
  };

  // Refresh email-verified and subscription status when window gains focus
  // or the tab becomes visible again (e.g., user returns from clicking the
  // verification link in their email client, or from the payment page).
  window.addEventListener("focus", onFocusOrVisible);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      onFocusOrVisible();
    }
  });
});
