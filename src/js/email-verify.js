import { isMobileDevice } from "./modules/util.js";

(function () {
  const urlParams = new URLSearchParams(window.location.search);

  const mode = urlParams.get("mode");
  const continueUrlRaw = urlParams.get("continueUrl");

  let source = null;
  if (continueUrlRaw) {
    try {
      source = new URL(continueUrlRaw).searchParams.get("source");
    } catch (_) {}
  }

  urlParams.delete("continueUrl");
  const forwardUrl = `/account-actions/?${urlParams}`;

  const isMobile = isMobileDevice();

  document.addEventListener("DOMContentLoaded", () => {
    if (source === "web" || !isMobile) {
      window.location.replace(forwardUrl);
      return;
    }

    const btn = document.getElementById("ev-continue-btn");
    btn.href = forwardUrl;
    document.getElementById("ev-loading").classList.add("acc-acts-hidden");
    document.getElementById("ev-continue-in-app").classList.remove("acc-acts-hidden");
  });
})();
