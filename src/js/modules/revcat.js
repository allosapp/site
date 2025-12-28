import * as PurchasesModule from "https://unpkg.com/@revenuecat/purchases-js@1.18.4/dist/Purchases.es.js";
import { storageKeys } from "./constants.js";
import { extractEmailTld } from "./util.js";
const ErrorCode = PurchasesModule.ErrorCode;
const PurchasesError = PurchasesModule.PurchasesError;

// Need to access Purchases again when loading from unpkg.
const Purchases = PurchasesModule.Purchases;

let _purchases = undefined;

const getUserPurchases = (uid) => {
  if (!uid) {
    return null;
  }
  if (!_purchases) {
    const apiKey =
      window.localStorage.getItem(storageKeys.sandboxKey)?.trim() ??
      "rcb_wtOLXBwmiEkKrEuzfyPqVMTNWRls";
    _purchases = Purchases.configure({
      apiKey,
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

export const getUserOfferings = async (uid) => {
  const purchases = getUserPurchases(uid);
  if (!purchases) {
    return null;
  }
  const offerings = await purchases.getOfferings();
  return offerings;
};

const getHasPremiumEntitlement = (customerInfo) => {
  if (!customerInfo) {
    return false;
  }

  const { entitlements } = customerInfo;
  return Object.entries(entitlements?.active ?? {}).length > 0;
};

export const getUserHasPremiumSub = async (uid) => {
  const customerInfo = await getCustomerInfo(uid);
  return getHasPremiumEntitlement(customerInfo);
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

export const openPurchaseFlow = async (uid, rcPackage) => {
  const purchases = getUserPurchases(uid);
  if (!purchases || !rcPackage) {
    return false;
  }

  try {
    const { customerInfo } = await purchases.purchase({
      rcPackage,
      skipSuccessPage: true,
    });
    return getHasPremiumEntitlement(customerInfo);
  } catch (e) {
    if (
      e instanceof PurchasesError &&
      e.errorCode == ErrorCode.UserCancelledError
    ) {
      // User cancelled the purchase process, don't do anything
    } else {
      console.error(e);
    }
    return false;
  }
};

const profilePurchaseLink = "https://pay.rev.cat/hmfdntctryrxknzb/";
export const getProfilePurchaseLink = (uid) => {
  if (!uid) {
    return "";
  }
  return profilePurchaseLink + uid;
};
