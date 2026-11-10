import { Op } from "sequelize";
import { FinanceTransaction } from "../../models/Finance SupplyHub/index.js";

const money = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP"
}).format(Number(value || 0));

const isoDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
};

const today = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());
const currentMonth = () => today().slice(0, 7);
const validMonth = (value) => typeof value === "string"
  && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
  && Number(value.slice(0, 4)) >= 1000;
const monthRange = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`];
};
const queryString = (value) => typeof value === "string" ? value.trim() : "";

const referenceNo = () => {
  const stamp = today().replaceAll("-", "");
  return `FIN-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

const toPlain = (row) => row.get({ plain: true });
const paymentMethodDisplay = (method) => ({
  bank: "Bank transfer", card: "Card", cash: "Cash", mobile: "E-wallet", other: "Other"
}[method] || method);
const shortDate = (value) => new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" })
  .format(new Date(`${value}T00:00:00`));

const sampleRows = (month) => [
  { id: "sample-1", referenceNo: "FIN-SAMPLE-001", type: "income", category: "Product sales", description: "School supplies bundle", amount: 12450, transactionDate: `${month}-02`, status: "paid", paymentMethod: "cash" },
  { id: "sample-2", referenceNo: "FIN-SAMPLE-002", type: "income", category: "Wholesale order", description: "Bulk notebook order", amount: 22100, transactionDate: `${month}-03`, status: "paid", paymentMethod: "bank" },
  { id: "sample-3", referenceNo: "FIN-SAMPLE-003", type: "income", category: "Product sales", description: "Office supplies order", amount: 9875, transactionDate: `${month}-05`, status: "paid", paymentMethod: "card" },
  { id: "sample-4", referenceNo: "FIN-SAMPLE-004", type: "income", category: "Online sales", description: "E-wallet checkout orders", amount: 6720, transactionDate: `${month}-06`, status: "paid", paymentMethod: "mobile" },
  { id: "sample-5", referenceNo: "FIN-SAMPLE-005", type: "income", category: "Product sales", description: "Bulk notebook order", amount: 15300, transactionDate: `${month}-07`, status: "paid", paymentMethod: "bank" },
  { id: "sample-6", referenceNo: "FIN-SAMPLE-006", type: "income", category: "Product sales", description: "Walk-in sales", amount: 3400, transactionDate: `${month}-09`, status: "pending", paymentMethod: "mobile" }
].map((row) => ({ ...row, demo: true }));

const normalizeFilters = (query = {}) => {
  const from = isoDate(queryString(query.from));
  const to = isoDate(queryString(query.to));
  return {
    status: ["paid", "pending", "cancelled"].includes(query.status) ? query.status : "",
    from: from || "",
    to: to || "",
    search: queryString(query.search).slice(0, 100),
    month: validMonth(query.month) ? query.month : currentMonth()
  };
};

const matchingTransactions = async (filters) => {
  const where = { type: "income" };
  if (filters.status) where.status = filters.status;
  const [monthStart, monthEnd] = monthRange(filters.month);
  where.transactionDate = { [Op.gte]: monthStart, [Op.lte]: monthEnd };
  if (filters.from && filters.from > monthStart) where.transactionDate[Op.gte] = filters.from;
  if (filters.to && filters.to < monthEnd) where.transactionDate[Op.lte] = filters.to;
  if (filters.search) where[Op.or] = [
    { referenceNo: { [Op.like]: `%${filters.search}%` } },
    { category: { [Op.like]: `%${filters.search}%` } },
    { description: { [Op.like]: `%${filters.search}%` } }
  ];

  const transactions = await FinanceTransaction.findAll({
    where, order: [["transactionDate", "DESC"], ["id", "DESC"]]
  });
  return transactions.map(toPlain);
};

const dashboardData = async (query = {}) => {
  const filters = normalizeFilters(query);
  const found = await matchingTransactions(filters);
  const isDefaultView = !filters.status && !filters.from && !filters.to && !filters.search;
  const isDemoData = !found.length && isDefaultView;
  const rows = isDemoData ? sampleRows(filters.month) : found;
  const hasFilters = Boolean(filters.status || filters.from || filters.to
    || filters.search || filters.month !== currentMonth());
  const active = rows.filter((row) => row.status !== "cancelled");
  const totalIncome = active.reduce((sum, row) => sum + Number(row.amount), 0);
  const collected = active.filter((row) => row.status === "paid").reduce((sum, row) => sum + Number(row.amount), 0);
  const pending = active.filter((row) => row.status === "pending").reduce((sum, row) => sum + Number(row.amount), 0);
  const paidCount = active.filter((row) => row.status === "paid").length;
  const pendingCount = active.filter((row) => row.status === "pending").length;
  const dateTotals = new Map();
  active.forEach((row) => {
    dateTotals.set(row.transactionDate, (dateTotals.get(row.transactionDate) || 0) + Number(row.amount));
  });
  const incomeDates = [...dateTotals.keys()].sort().slice(-7);
  const incomeFlow = incomeDates.map((date) => ({
    date,
    label: new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`)),
    income: dateTotals.get(date),
    incomeDisplay: money(dateTotals.get(date))
  }));
  const incomeMax = incomeFlow.length ? Math.max(...incomeFlow.map((item) => item.income), 1) : 1;
  const cashFlowChart = incomeFlow.map((item) => ({
    ...item,
    incomeHeight: Math.max(4, Math.round(item.income / incomeMax * 100))
  }));
  const [selectedYear, selectedMonthNumber] = filters.month.split("-").map(Number);
  const monthDate = new Date(Date.UTC(selectedYear, selectedMonthNumber - 1, 1));
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(monthDate);

  return {
    transactions: rows.slice(0, 5).map((row) => ({
      ...row,
      amountDisplay: money(row.amount),
      amountSign: "+",
      paymentMethodDisplay: paymentMethodDisplay(row.paymentMethod),
      statusLabel: row.status === "paid" ? "Completed" : row.status === "pending" ? "Pending" : "Cancelled",
      shortDate: shortDate(row.transactionDate),
      isPending: row.status === "pending",
      isDemo: Boolean(row.demo)
    })),
    totalIncome: money(totalIncome),
    collectedAmount: money(collected),
    pendingAmount: money(pending),
    transactionCount: rows.length,
    paidCount,
    pendingCount,
    cashFlowChart,
    isDemoData,
    selectedMonth: filters.month,
    monthLabel,
    filterStatusPaid: filters.status === "paid",
    filterStatusPending: filters.status === "pending",
    filterStatusCancelled: filters.status === "cancelled",
    filters: {
      ...filters
    },
    hasFilters
  };
};

export const dashboard = async (req, res, next) => {
  try {
    const data = await dashboardData(req.query);
    res.render("Finance SupplyHub/dashboard", {
      title: "Finance SupplyHub", moduleName: "Finance SupplyHub",
      moduleDescription: "Track income, payments, and financial performance.",
      defaultDate: today(), ...data
    });
  } catch (error) { next(error); }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { category, description, amount, transactionDate, status, paymentMethod } = req.body;
    if (typeof category !== "string" || !category.trim() || !isoDate(transactionDate)) {
      req.flash("error_msg", "Choose a valid category and date.");
      return res.redirect("/finance");
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      req.flash("error_msg", "Enter a valid amount greater than zero.");
      return res.redirect("/finance");
    }
    if (!["paid", "pending", "cancelled"].includes(status)
      || !["cash", "bank", "card", "mobile", "other"].includes(paymentMethod)) {
      req.flash("error_msg", "Choose a valid payment status and method.");
      return res.redirect("/finance");
    }
    await FinanceTransaction.create({
      referenceNo: referenceNo(), type: "income", category: category.trim(), description: description?.trim() || "",
      amount: numericAmount.toFixed(2), transactionDate, status, paymentMethod, recordedBy: req.currentUser.id
    });
    req.flash("success_msg", "Finance transaction recorded successfully.");
    res.redirect(`/finance?month=${transactionDate.slice(0, 7)}`);
  } catch (error) { next(error); }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByPk(req.params.id);
    if (!transaction) {
      req.flash("error_msg", "The finance transaction could not be found.");
      return res.redirect("/finance");
    }
    const numericAmount = Number(req.body.amount);
    if (typeof req.body.category !== "string" || !req.body.category.trim()
      || !isoDate(req.body.transactionDate) || !Number.isFinite(numericAmount) || numericAmount <= 0
      || !["paid", "pending", "cancelled"].includes(req.body.status)
      || !["cash", "bank", "card", "mobile", "other"].includes(req.body.paymentMethod)) {
      req.flash("error_msg", "The transaction contains invalid information.");
      return res.redirect("/finance");
    }
    await transaction.update({
      category: req.body.category.trim(), description: req.body.description?.trim() || "",
      amount: numericAmount.toFixed(2), transactionDate: req.body.transactionDate,
      status: req.body.status, paymentMethod: req.body.paymentMethod
    });
    req.flash("success_msg", "Finance transaction updated successfully.");
    res.redirect(`/finance?month=${req.body.transactionDate.slice(0, 7)}`);
  } catch (error) { next(error); }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByPk(req.params.id);
    if (!transaction) {
      req.flash("error_msg", "The finance transaction could not be found.");
      return res.redirect("/finance");
    }
    const month = String(transaction.transactionDate).slice(0, 7);
    await transaction.destroy();
    req.flash("success_msg", "Finance transaction deleted successfully.");
    res.redirect(`/finance?month=${month}`);
  } catch (error) { next(error); }
};

export const updateTransactionStatus = async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByPk(req.params.id);
    if (!transaction) {
      req.flash("error_msg", "The finance transaction could not be found.");
      return res.redirect("/finance");
    }
    if (!["paid", "pending", "cancelled"].includes(req.body.status)) {
      req.flash("error_msg", "Choose a valid transaction status.");
      return res.redirect("/finance");
    }
    await transaction.update({ status: req.body.status });
    req.flash("success_msg", `Transaction marked as ${req.body.status}.`);
    res.redirect("/finance");
  } catch (error) { next(error); }
};

export const exportTransactions = async (req, res, next) => {
  try {
    const filters = normalizeFilters(req.query);
    const transactions = await matchingTransactions(filters);
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const header = ["Reference", "Date", "Category", "Description", "Amount", "Status", "Payment Method"];
    const lines = transactions.map((row) => [
      row.referenceNo, row.transactionDate, row.category, row.description,
      Number(row.amount).toFixed(2), row.status, row.paymentMethod
    ].map(escape).join(","));
    res.type("text/csv").set("Content-Disposition", "attachment; filename=\"finance-transactions.csv\"")
      .send([header.map(escape).join(","), ...lines].join("\n"));
  } catch (error) { next(error); }
};
