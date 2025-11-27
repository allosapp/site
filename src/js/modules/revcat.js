import * as PurchasesModule from "https://unpkg.com/@revenuecat/purchases-js@1.18.4/dist/Purchases.es.js";
import { extractEmailTld } from "./util.js";

// Need to access Purchases again when loading from unpkg.
const Purchases = PurchasesModule.Purchases;

let _purchases = undefined;

const getUserPurchases = (uid) => {
  if (!uid) {
    return null;
  }
  if (!_purchases) {
    _purchases = Purchases.configure({
      apiKey: "rcb_wtOLXBwmiEkKrEuzfyPqVMTNWRls",
      appUserId: uid,
    });
  }
  return _purchases;
};

const getCustomerInfo = async (uid) => {
  const purchases = getUserPurchases(uid);
  if (!purchases) {
    return null;
  }

  let customerInfo;
  if (purchases.getAppUserId() !== uid) {
    customerInfo = await purchases.changeUser(uid);
  } else {
    customerInfo = await purchases.getCustomerInfo();
  }
  return customerInfo;
};

export const getUserHasPremiumSub = async (user) => {
  const customerInfo = await getCustomerInfo(user?.uid);
  if (!customerInfo) {
    return false;
  }

  const { entitlements } = customerInfo;
  return Object.entries(entitlements?.active ?? {}).length > 0;
};

/**
 * Set custom attributes for a user in RevenueCat.
 */
export const setUserAttributes = async (user) => {
  if (!user || !user.uid) {
    return;
  }
  const purchases = getUserPurchases(user.uid);
  if (!purchases) {
    return;
  }

  const attributes = {};

  // Add email TLD if email exists
  if (user.email) {
    const tld = extractEmailTld(user.email);
    if (tld) {
      attributes.emailTld = tld;
    }
  }

  // Only call setAttributes if we have attributes to set
  if (Object.keys(attributes).length > 0) {
    try {
      await purchases.setAttributes(attributes);
    } catch (error) {
      console.error("Failed to set RevenueCat attributes:", error);
    }
  }
};

const profilePurchaseLink = "https://pay.rev.cat/hmfdntctryrxknzb/";
export const getProfilePurchaseLink = (uid) => {
  if (!uid) {
    return "";
  }
  return profilePurchaseLink + uid;
};
