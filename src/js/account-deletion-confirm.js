// Account-deletion confirmation page (deletion plan §8; API contract
// §5.2/§3). Commits the deletion with the emailed single-use token, shows
// the job reference, and polls the status lookup while the page is open.
// Truthfulness rules: pending is never rendered as deleted, and the
// terminal states render only from the status lookup. The confirm
// endpoint is idempotent for a re-clicked link, so refreshes are safe.
const DELETION_SERVICE_BASE_URL =
  "https://us-central1-allos-4b301.cloudfunctions.net";
const POLL_INTERVAL_MS = 5000;

(function () {
  const token = new URLSearchParams(window.location.search).get("token");

  const show = (id) => {
    for (const sectionId of [
      "adc-loading",
      "adc-pending",
      "adc-completed",
      "adc-followup",
      "adc-invalid",
      "adc-error",
    ]) {
      document
        .getElementById(sectionId)
        .classList.toggle("acc-acts-hidden", sectionId !== id);
    }
  };

  let pollTimer = null;
  const stopPolling = () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const renderStatus = (status) => {
    if (status === "completed") {
      stopPolling();
      show("adc-completed");
    } else if (status === "completed_with_manual_followup") {
      stopPolling();
      show("adc-followup");
    }
    // "pending" (and any lookup hiccup) keeps the honest in-progress view.
  };

  const pollStatus = async (jobReference) => {
    try {
      const response = await fetch(
        `${DELETION_SERVICE_BASE_URL}/getDeletionStatus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobReference }),
        }
      );
      if (!response.ok) {
        return;
      }
      renderStatus((await response.json()).status);
    } catch (_) {
      // Transient lookup failure: stay on the pending view.
    }
  };

  const confirm = async () => {
    show("adc-loading");
    if (!token) {
      show("adc-invalid");
      return;
    }
    let response;
    try {
      response = await fetch(
        `${DELETION_SERVICE_BASE_URL}/confirmWebDeletion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );
    } catch (_) {
      show("adc-error");
      return;
    }
    if (response.status === 400) {
      // Invalid/expired/used-and-aged link -- constant server response.
      show("adc-invalid");
      return;
    }
    if (!response.ok) {
      show("adc-error");
      return;
    }
    const body = await response.json();
    document.getElementById("adc-reference").textContent = body.jobReference;
    show("adc-pending");
    pollStatus(body.jobReference);
    stopPolling();
    pollTimer = setInterval(() => pollStatus(body.jobReference), POLL_INTERVAL_MS);
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("adc-retry").addEventListener("click", confirm);
    confirm();
  });
})();
