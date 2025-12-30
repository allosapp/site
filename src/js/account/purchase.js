import { Auth, getAuthInstance } from "../modules/firebase.js";
import { getUserHasPremiumSub, getUserOfferings, openPurchaseFlow } from "../modules/revcat.js";
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

  const formatPeriodDuration = (periodDuration, cycleCount = 1, omitOne = false) => {
    if (!periodDuration) return "";
    // ISO 8601 duration format: P1M, P1Y, P1W, P7D, etc.
    const match = periodDuration.match(/^P(\d+)([DWMY])$/);
    if (!match) return periodDuration;
    const [, count, unit] = match;
    const num = parseInt(count, 10) * cycleCount;
    const units = {
      D: num === 1 ? "day" : "days",
      W: num === 1 ? "week" : "weeks",
      M: num === 1 ? "month" : "months",
      Y: num === 1 ? "year" : "years",
    };
    if (num === 1 && omitOne) {
      return units[unit] || unit;
    }
    return `${num} ${units[unit] || unit}`;
  };

  const getIntroOfferInfo = (product) => {
    const freeTrialPhase = product?.freeTrialPhase;
    const introPricePhase = product?.introPricePhase;

    if (!freeTrialPhase && !introPricePhase) {
      return null;
    }

    const info = {
      hasIntroPrice: !!introPricePhase,
      hasFreeTrial: !!freeTrialPhase,
      introPriceDuration: null,
    };

    if (introPricePhase) {
      const cycleCount = introPricePhase.cycleCount || 1;
      info.introPriceDuration = formatPeriodDuration(
        introPricePhase.periodDuration,
        cycleCount,
        true
      );
    }

    return info;
  };

  const createIntroOfferElement = (product) => {
    const freeTrialPhase = product?.freeTrialPhase;
    const introPricePhase = product?.introPricePhase;

    if (!freeTrialPhase && !introPricePhase) {
      return null;
    }

    const introOffer = document.createElement("div");
    introOffer.className = "intro-offer";

    if (freeTrialPhase) {
      const trialText = document.createElement("div");
      trialText.className = "intro-offer-trial";
      const duration = formatPeriodDuration(freeTrialPhase.periodDuration);
      trialText.textContent = `${duration} free trial`;
      introOffer.appendChild(trialText);
    }

    if (introPricePhase) {
      const introText = document.createElement("div");
      introText.className = "intro-offer-price";
      const cycleCount = introPricePhase.cycleCount || 1;
      const duration = formatPeriodDuration(
        introPricePhase.periodDuration,
        cycleCount,
        true
      );
      const price = introPricePhase.price?.formattedPrice || "";

      const priceAmount = document.createElement("span");
      priceAmount.className = "amount";
      priceAmount.textContent = price;

      const pricePeriod = document.createElement("span");
      pricePeriod.className = "period";
      pricePeriod.textContent = ` for the first ${duration}`;

      introText.appendChild(priceAmount);
      introText.appendChild(pricePeriod);
      introOffer.appendChild(introText);
    }

    return introOffer;
  };

  const createPackageCard = (rcPackage) => {
    const card = document.createElement("div");
    card.className = "package-card";

    const packageType = document.createElement("div");
    packageType.className = "package-type";
    packageType.textContent = getPackageType(rcPackage);

    const title = document.createElement("div");
    title.className = "package-title";
    title.textContent =
      rcPackage.rcBillingProduct?.displayName || "Allos Premium";

    const product = rcPackage.rcBillingProduct;
    const introOfferInfo = getIntroOfferInfo(product);
    const introOffer = createIntroOfferElement(product);

    const price = document.createElement("div");
    price.className = introOfferInfo?.hasIntroPrice
      ? "package-price"
      : "package-price-primary";

    const priceAmount = document.createElement("span");
    priceAmount.className = "amount";
    priceAmount.textContent = product?.currentPrice?.formattedPrice || "";

    const pricePeriod = document.createElement("span");
    pricePeriod.className = "period";
    if (introOfferInfo?.hasIntroPrice) {
      const thenText = document.createElement("span");
      thenText.textContent = "then ";
      price.appendChild(thenText);
      pricePeriod.textContent = " after";
    } else {
      pricePeriod.textContent = " " + getPricePeriod(rcPackage);
    }

    price.appendChild(priceAmount);
    price.appendChild(pricePeriod);

    card.appendChild(packageType);
    card.appendChild(title);
    if (introOffer) {
      card.appendChild(introOffer);
    }
    card.appendChild(price);

    card.addEventListener("click", async () => {
      elements.mainContent.classList.add("invisible");
      elements.loadingContainer.classList.remove("invisible");

      const success = await openPurchaseFlow(currentUser.uid, rcPackage);

      if (success) {
        window.location.assign("/account/welcome/");
      } else {
        elements.loadingContainer.classList.add("invisible");
        elements.mainContent.classList.remove("invisible");
      }
    });

    return card;
  };

  const renderPackages = (offerings) => {
    elements.packagesContainer.innerHTML = "";

    const currentOffering = offerings?.current;
    if (!currentOffering || !currentOffering.availablePackages?.length) {
      elements.errorMessage.textContent =
        "No subscription options available at this time.";
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
      const hasPremium = await getUserHasPremiumSub(user.uid);
      if (hasPremium) {
        window.location.replace("/account/profile/");
        return;
      }

      const offerings = await getUserOfferings(user.uid);
      renderPackages(offerings);
    } catch (error) {
      console.error("Failed to load offerings:", error);
      showError("Failed to load subscription options. Please try again later.");
    }

    hideLoading();
  });
});
