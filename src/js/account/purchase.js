import { Auth, getAuthInstance } from "../modules/firebase.js";
import { getUserOfferings, openPurchaseFlow } from "../modules/revcat.js";
import { runOnLoad } from "../modules/util.js";

runOnLoad(() => {
  let currentUser = undefined;
  let isLoading = true;
  const auth = getAuthInstance();
  const elements = {
    loadingContainer: document.getElementById("loading-container"),
    mainContent: document.getElementById("main-content"),
    packagesContainer: document.getElementById("packages-container"),
    errorMessage: document.getElementById("error-message"),
  };

  const getPackageType = (rcPackage) => {
    const id = rcPackage.identifier.toLowerCase();
    if (id.includes("annual") || id.includes("yearly") || id.includes("year")) {
      return "Annual";
    }
    if (id.includes("monthly") || id.includes("month")) {
      return "Monthly";
    }
    if (id.includes("weekly") || id.includes("week")) {
      return "Weekly";
    }
    if (id.includes("lifetime")) {
      return "Lifetime";
    }
    return rcPackage.packageType || "Subscription";
  };

  const getPricePeriod = (rcPackage) => {
    const id = rcPackage.identifier.toLowerCase();
    if (id.includes("annual") || id.includes("yearly") || id.includes("year")) {
      return "per year";
    }
    if (id.includes("monthly") || id.includes("month")) {
      return "per month";
    }
    if (id.includes("weekly") || id.includes("week")) {
      return "per week";
    }
    if (id.includes("lifetime")) {
      return "one time";
    }
    return "";
  };

  const createPackageCard = (rcPackage) => {
    const card = document.createElement("div");
    card.className = "package-card";

    const packageType = document.createElement("div");
    packageType.className = "package-type";
    packageType.textContent = getPackageType(rcPackage);

    const title = document.createElement("div");
    title.className = "package-title";
    title.textContent = rcPackage.rcBillingProduct?.displayName || "Allos Premium";

    const price = document.createElement("div");
    price.className = "package-price";

    const priceAmount = document.createElement("span");
    priceAmount.className = "amount";
    priceAmount.textContent = rcPackage.rcBillingProduct?.currentPrice?.formattedPrice || "";

    const pricePeriod = document.createElement("span");
    pricePeriod.className = "period";
    pricePeriod.textContent = " " + getPricePeriod(rcPackage);

    price.appendChild(priceAmount);
    price.appendChild(pricePeriod);

    card.appendChild(packageType);
    card.appendChild(title);
    card.appendChild(price);

    card.addEventListener("click", async () => {
      card.style.opacity = "0.7";
      card.style.pointerEvents = "none";
      
      const success = await openPurchaseFlow(currentUser.uid, rcPackage);
      
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
      
      if (success) {
        window.location.assign("/account/profile/");
      }
    });

    return card;
  };

  const renderPackages = (offerings) => {
    elements.packagesContainer.innerHTML = "";

    const currentOffering = offerings?.current;
    if (!currentOffering || !currentOffering.availablePackages?.length) {
      elements.errorMessage.textContent = "No subscription options available at this time.";
      elements.errorMessage.classList.remove("invisible");
      return;
    }

    currentOffering.availablePackages.forEach((rcPackage) => {
      const card = createPackageCard(rcPackage);
      elements.packagesContainer.appendChild(card);
    });
  };

  const showError = (message) => {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove("invisible");
  };

  const hideLoading = () => {
    if (isLoading) {
      setTimeout(() => {
        isLoading = false;
        elements.loadingContainer.classList.add("invisible");
        elements.mainContent.classList.remove("invisible");
      }, 500);
    }
  };

  Auth.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("/account/sign-in/");
      return;
    }

    if (!user.emailVerified) {
      window.location.replace("/account/profile/");
      return;
    }

    currentUser = user;

    try {
      const offerings = await getUserOfferings(user.uid);
      renderPackages(offerings);
    } catch (error) {
      console.error("Failed to load offerings:", error);
      showError("Failed to load subscription options. Please try again later.");
    }

    hideLoading();
  });
});
