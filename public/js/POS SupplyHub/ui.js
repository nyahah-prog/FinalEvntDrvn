const goToShortcut = (selector) => {
  const control = document.querySelector(selector);
  if (!control) return false;
  const destination = control.getAttribute("data-keyboard-back") || control.href;
  if (destination && destination !== window.location.href) window.location.assign(destination);
  return true;
};

const focusShortcut = (selector) => {
  const control = document.querySelector(selector);
  if (!control) return false;
  control.focus();
  return true;
};

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === "F2") {
    event.preventDefault();
    if (!focusShortcut("[data-shortcut-search]")) {
      window.location.assign("/pos/products?focus=search");
    }
  } else if (event.key === "F3") {
    if (!document.querySelector("[data-shortcut-f3]")) return;
    event.preventDefault();
    goToShortcut("[data-shortcut-f3]");
  } else if (event.key === "F4") {
    const checkoutForm = document.querySelector("#checkout-form");
    if (!checkoutForm) return;
    event.preventDefault();
    if (checkoutForm.querySelector(":invalid")) {
      checkoutForm.reportValidity();
      return;
    }
    if (document.querySelector('[form="checkout-form"][type="submit"]')?.disabled) {
      document.querySelector("[data-shortcut-status]")?.replaceChildren(
        "Add a product to the order before checkout."
      );
      return;
    }
    checkoutForm.requestSubmit();
  } else if (event.key === "F5") {
    event.preventDefault();
    if (goToShortcut("[data-shortcut-f5]")) return;
    if (!focusShortcut("[data-shortcut-focus]")) {
      window.location.assign("/pos/product-management");
    }
  } else if (event.key === "F6") {
    event.preventDefault();
    if (!focusShortcut("[data-shortcut-scan]")) {
      window.location.assign("/pos/products?focus=scan");
    }
  } else if (event.key === "F7") {
    const receiptButton = document.querySelector("[data-receipt-open]");
    if (!receiptButton) return;
    event.preventDefault();
    const receiptDialog = document.querySelector("[data-receipt-dialog]");
    if (receiptDialog?.open) {
      document.querySelector("[data-receipt-print]")?.focus();
      return;
    }
    receiptButton.click();
  } else if (event.key === "F8") {
    const clearButton = document.querySelector("[data-shortcut-clear]");
    if (!clearButton) return;
    event.preventDefault();
    clearButton.form?.requestSubmit();
  } else if (event.key === "F9") {
    if (!focusShortcut("#discountType")) return;
    event.preventDefault();
  } else if (event.key === "F10") {
    if (!focusShortcut("#paymentMethod")) return;
    event.preventDefault();
  } else if (event.key === "Escape") {
    const receiptDialog = document.querySelector("[data-receipt-dialog][open]");
    if (receiptDialog) {
      event.preventDefault();
      receiptDialog.close();
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement?.matches("[data-shortcut-search], [data-shortcut-scan]")
      && activeElement.value) {
      event.preventDefault();
      activeElement.value = "";
      return;
    }

    if (goToShortcut("[data-keyboard-back]")) event.preventDefault();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const requestedFocus = new URLSearchParams(window.location.search).get("focus");
  if (requestedFocus === "search") focusShortcut("[data-shortcut-search]");
  if (requestedFocus === "scan") focusShortcut("[data-shortcut-scan]");

  const receiptDialog = document.querySelector("[data-receipt-dialog]");
  const openButton = document.querySelector("[data-receipt-open]");
  const closeButton = document.querySelector("[data-receipt-close]");
  const printButton = document.querySelector("[data-receipt-print]");

  if (!receiptDialog || !openButton) return;

  openButton.addEventListener("click", () => {
    const customerSelect = document.querySelector("#customerId");
    const selectedCustomer = customerSelect?.selectedOptions[0]?.textContent.trim();
    const customerLabel = receiptDialog.querySelector("[data-receipt-customer]");
    const dateLabel = receiptDialog.querySelector("[data-receipt-date]");

    if (customerLabel) customerLabel.textContent = selectedCustomer || "Walking Customer";
    if (dateLabel) dateLabel.textContent = new Date().toLocaleString();
    receiptDialog.showModal();
  });

  closeButton?.addEventListener("click", () => receiptDialog.close());
  printButton?.addEventListener("click", () => window.print());
});
