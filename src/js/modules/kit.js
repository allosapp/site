export const subscribeEmailToMailingList = async ({ email, name }) => {
  if (!email) {
    return;
  }

  try {
    await fetch("https://app.convertkit.com/forms/7940181/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        "fields[first_name]": name ?? "",
        email_address: email,
      }),
    });
  } catch (e) {
    console.error(
      `Kit: Error while requesting to subscribe user to email list.`,
      e,
    );
  }
};
