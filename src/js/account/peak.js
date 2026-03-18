import { storageKeys } from "../modules/constants.js";
import { runOnLoad } from "../modules/util.js";

const utmCampaign = "partner_peak";
runOnLoad(() => {
  localStorage.setItem(storageKeys.utmCampaign, utmCampaign);
});
