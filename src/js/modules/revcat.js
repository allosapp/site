import * as PurchasesModule from "https://unpkg.com/@revenuecat/purchases-js@1.18.4/dist/Purchases.es.js";

// Need to access Purchases again when loading from unpkg.
const Purchases = PurchasesModule.Purchases;

const purchasesByUser = {};

const getUserPurchases = (uid) => {
  if (!uid) {
    return null;
  }
  if (purchasesByUser[uid]) {
    return purchasesByUser[uid];
  }
  const purchases = Purchases.configure({
    apiKey: "rcb_wtOLXBwmiEkKrEuzfyPqVMTNWRls",
    appUserId: uid,
  });
  purchasesByUser[uid] = purchases;
  return purchases;
};

export const getUserHasPremiumSub = async (user) => {
  if (!user?.uid) {
    return false;
  }
  const purchases = getUserPurchases(user.uid);
  if (!purchases) {
    return false;
  }

  const customerInfo = await purchases.getCustomerInfo();
  if (!customerInfo) {
    return false;
  }

  const { entitlements } = customerInfo;

  return Object.entries(entitlements?.active ?? {}).length > 0;
};

const profilePurchaseLink = "https://pay.rev.cat/hmfdntctryrxknzb/";
export const getProfilePurchaseLink = (uid) => {
  if (!uid) {
    return "";
  }
  return profilePurchaseLink + uid;
};
