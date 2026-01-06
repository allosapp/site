import { storageKeys } from "../modules/constants.js";
import { runOnLoad } from "../modules/util.js";

const utm_campaign = "partner_peak";
runOnLoad(() => {
  localStorage.setItem(storageKeys.utmCampaign, utm_campaign);
});
