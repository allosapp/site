import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import * as firebase from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

(function () {
  let app;
  let auth;
  let newPassword;
  let currentWorkflow = null;
  let workflows = {};
  let elements = {};

  // Mock Firebase auth functions for easier local development.
  const _DEV_MODE = false;

  const urlParams = getUrlParams();

  function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
      // Get our Firebase API key, provided for convenience in the URL params.
      apiKey: urlParams.get("apiKey"),
      // Get the action to complete.
      action: urlParams.get("mode"),
      // Get the one-time code.
      otp: urlParams.get("oobCode"),
      // (Optional) Get the continue URL from the query parameter if available.
      continueUrl: urlParams.get("continueUrl"),
      // (Optional) Get the language code if available.
      lang: urlParams.get("lang") || "en",
    };
  }

  function showWorkflow(workflow) {
    if (currentWorkflow) {
      currentWorkflow?.classList.add("acc-acts-hidden");
    }
    workflow?.classList.remove("acc-acts-hidden");
    currentWorkflow = workflow;
  }

  async function verifyPasswordResetRequest() {
    if (_DEV_MODE) {
      return { success: true, email: "test-user@allos.app" };
    }

    const { otp } = urlParams;
    try {
      // Verify the password reset code is valid.
      const email = await firebase.verifyPasswordResetCode(auth, otp);
      return { success: true, email };
    } catch (e) {
      // Invalid or expired action code.
      return { success: false };
    }
  }

  async function confirmPasswordReset() {
    if (_DEV_MODE) {
      return { success: true };
    }

    const { otp } = urlParams;
    try {
      // Confirm the password the user has entered password.
      const res = await firebase.confirmPasswordReset(auth, otp, newPassword);
      // Password reset has been confirmed and new password updated.
      return { success: true };
    } catch (e) {
      // Error occurred during confirmation. The code might have expired or the password is too weak.
      return { success: false };
    }
  }

  async function confirmEmail() {
    if (_DEV_MODE) {
      return { success: true };
    }

    const { otp } = urlParams;
    try {
      // Try to apply the email verification code.
      const res = await firebase.applyActionCode(auth, otp);
      // Email address has been verified.
      return { success: true };
    } catch (e) {
      // Code is invalid or expired.
      return { success: false };
    }
  }

  async function startResetPasswordFlow() {
    const { success, email } = await verifyPasswordResetRequest();
    if (!success) {
      showWorkflow(workflows.resetPasswordError);
      return;
    }
    elements.userEmail.textContent = email;

    const validatePassword = () => newPassword && newPassword.length > 4;
    elements.passwordInput.addEventListener("input", (e) => {
      newPassword = e.target.value;
      elements.passwordSubmit.disabled = !validatePassword();
    });

    const handlePasswordSubmit = () => {
      if (!validatePassword()) {
        return;
      }
      elements.passwordInput.disabled = true;
      elements.passwordSubmit.disabled = true;
      finishResetPasswordFlow();
    };

    elements.passwordSubmit.addEventListener("click", handlePasswordSubmit);
    elements.passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handlePasswordSubmit();
      }
    });

    showWorkflow(workflows.resetPassword);
  }

  async function finishResetPasswordFlow() {
    // Save the new password.
    const { success } = await confirmPasswordReset();
    if (!success) {
      // The code might have expired or the password is too weak.
      showWorkflow(workflows.resetPasswordError);
      return;
    }
    showWorkflow(workflows.resetPasswordSuccess);
  }

  async function startVerifyEmailFlow() {
    const { success } = await confirmEmail();
    if (!success) {
      showWorkflow(workflows.emailNotVerified);
      return;
    }
    const { continueUrl } = urlParams;
    // TODO: If a continue URL is available, provide a link back to the app.
    showWorkflow(workflows.emailVerified);
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      elements = {
        passwordInput: document.getElementById("acc-acts-new-password"),
        passwordSubmit: document.getElementById("acc-acts-save-password"),
        userEmail: document.getElementById("acc-acts-user-email"),
      };

      workflows = {
        emailVerified: document.getElementById("acc-acts-email-verified"),
        emailNotVerified: document.getElementById(
          "acc-acts-email-not-verified"
        ),
        genericError: document.getElementById("acc-acts-generic-error"),
        resetPassword: document.getElementById("acc-acts-reset-password"),
        resetPasswordSuccess: document.getElementById(
          "acc-acts-reset-password-success"
        ),
        resetPasswordError: document.getElementById(
          "acc-acts-reset-password-error"
        ),
      };

      const { action, apiKey } = getUrlParams();

      if (!apiKey) {
        showWorkflow(workflows.genericError);
        return;
      }

      // Configure the Firebase SDK.
      app = initializeApp({ apiKey });
      auth = firebase.getAuth(app);

      // Handle the user management action.
      switch (action) {
        case "resetPassword":
          startResetPasswordFlow();
          break;
        case "verifyEmail":
          startVerifyEmailFlow();
          break;
        case "recoverEmail":
        default:
          // Error: invalid/unsupported mode.
          showWorkflow(workflows.genericError);
      }
    },
    false
  );
})();
