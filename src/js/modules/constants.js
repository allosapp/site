export const storageKeys = {
  sandboxKey: "rc-sb-key",
  purchaseEmail: "purchase-email-address",
  verifyEmail: "verify-email-address",
  utmCampaign: "utm_campaign",
  // sessionStorage flag — set by sign-in.js, consumed once by profile.js
  // to gate the post-sign-in redirect to /account/purchase/
  justSignedIn: "just-signed-in",
};
