import * as PurchasesModule from "https://unpkg.com/@revenuecat/purchases-js@1.18.4/dist/Purchases.es.js";

// Need to access Purchases again when loading from unpkg.
const Purchases = PurchasesModule.Purchases;

let purchases = undefined;

const getCustomerInfo = async (uid) => {
  if (!uid) {
    return null;
  }
  let customerInfo;
  if (!purchases) {
    purchases = Purchases.configure({
      apiKey: "rcb_wtOLXBwmiEkKrEuzfyPqVMTNWRls",
      appUserId: uid,
    });
  } 
  
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

const profilePurchaseLink = "https://pay.rev.cat/hmfdntctryrxknzb/";
export const getProfilePurchaseLink = (uid) => {
  if (!uid) {
    return "";
  }
  return profilePurchaseLink + uid;
};
