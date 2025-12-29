export const runOnLoad = (cb) => {
  document.addEventListener("DOMContentLoaded", cb, false);
};

export const getUserDisplayName = (user) => {
  return (
    user?.displayName ?? user?.email?.slice(0, user.email?.indexOf("@")) ?? ""
  );
};

/**
 * Extract the TLD (top-level domain) from an email address.
 * Examples:
 *   jim.doe@hello.com -> 'com'
 *   user@example.co.uk -> 'uk'
 *
 * @param {string} email - The email address
 * @returns {string|null} The TLD or null if invalid
 */
export const extractEmailTld = (email) => {
  if (!email || typeof email !== "string") {
    return null;
  }

  // Split by @ to get domain part
  const parts = email.split("@");
  if (parts.length !== 2) {
    return null;
  }

  // Get the domain and extract TLD (last part after final dot)
  const domain = parts[1];
  const domainParts = domain.split(".");
  if (domainParts.length === 0) {
    return null;
  }

  return domainParts[domainParts.length - 1].toLowerCase();
};
