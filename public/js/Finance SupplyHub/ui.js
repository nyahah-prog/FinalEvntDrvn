document.querySelectorAll("[data-edit-transaction]").forEach((button) => {
  button.addEventListener("click", () => {
    const editReference = document.querySelector("#edit-reference");
    const editId = document.querySelector("#edit-id");
    const editCategory = document.querySelector("#edit-category");
    const editDescription = document.querySelector("#edit-description");
    const editAmount = document.querySelector("#edit-amount");
    const editDate = document.querySelector("#edit-date");
    const editStatus = document.querySelector("#edit-status");
    const editPayment = document.querySelector("#edit-payment");
    const editForm = document.querySelector("#edit-form");
    const editModal = document.querySelector("#edit-modal");
    if (!editReference || !editId || !editCategory || !editDescription || !editAmount
      || !editDate || !editStatus || !editPayment || !editForm || !editModal) return;
    editReference.textContent = button.dataset.reference;
    editId.value = button.dataset.id;
    editCategory.value = button.dataset.category;
    editDescription.value = button.dataset.description || "";
    editAmount.value = button.dataset.amount;
    editDate.value = button.dataset.date;
    editStatus.value = button.dataset.status;
    editPayment.value = button.dataset.payment;
    editForm.action = `/finance/transactions/${button.dataset.id}`;
    editModal.showModal();
  });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog")?.close());
});

document.querySelectorAll(".finance-avatar, .finance-user-avatar").forEach((avatar) => {
  const initials = avatar.textContent.trim().split(/\s+/)
    .map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  avatar.textContent = initials || "FH";
});

document.querySelector(".finance-print-button")?.addEventListener("click", () => window.print());

document.querySelector("#new-transaction-button")?.addEventListener("click", () => {
  document.querySelector("#new-transaction-modal")?.showModal();
});

const exportQuery = new URLSearchParams(window.location.search);
const exportQueryString = exportQuery.toString();
document.querySelectorAll(".finance-export-button, .finance-nav-export").forEach((button) => {
  button.href = `/finance/export.csv${exportQueryString ? `?${exportQueryString}` : ""}`;
});
