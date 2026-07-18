// Account-deletion request page (deletion plan §8; API contract §5.1).
// Posts the address to requestWebDeletion and shows the constant
// confirmation -- the response is identical whether or not an account
// exists, so this page never learns (or reveals) account existence.
const DELETION_SERVICE_BASE_URL =
  "https://us-central1-allos-4b301.cloudfunctions.net";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("ad-email");
    const submitBtn = document.getElementById("ad-submit");
    const errorEl = document.getElementById("ad-error");

    const showError = (message) => {
      errorEl.textContent = message;
      errorEl.classList.remove("acc-acts-hidden");
    };

    submitBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      errorEl.classList.add("acc-acts-hidden");
      if (!EMAIL_PATTERN.test(email)) {
        showError("Please enter a valid email address.");
        return;
      }
      submitBtn.disabled = true;
      try {
        const response = await fetch(
          `${DELETION_SERVICE_BASE_URL}/requestWebDeletion`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );
        if (!response.ok) {
          throw new Error(`request failed (${response.status})`);
        }
        document.getElementById("ad-sent-email").textContent = email;
        document.getElementById("ad-request").classList.add("acc-acts-hidden");
        document.getElementById("ad-sent").classList.remove("acc-acts-hidden");
      } catch (_) {
        showError(
          "We couldn't send the request right now. Please check your connection and try again."
        );
        submitBtn.disabled = false;
      }
    });
  });
})();
