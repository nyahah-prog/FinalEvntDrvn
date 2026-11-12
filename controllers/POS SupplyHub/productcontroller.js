/*
    MIT License
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines
*/
import { Product } from "../../models/Product.js";
import { User } from "../../models/userModel.js";
import { Op } from "sequelize";
import { sequelize } from "../../models/db.js";

// In-memory array arrays for cart and transactions to avoid database schema path errors
let cart = [];
let transactionHistory = [];
let cartDiscount = { value: 0, type: "amount" };

const getCartTotals = () => {
  const subtotal = cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const requestedDiscount = cartDiscount.type === "percent"
    ? subtotal * cartDiscount.value / 100
    : cartDiscount.value;
  const discountAmount = Math.min(requestedDiscount, subtotal);

  return {
    subtotal,
    discountAmount,
    totalAmount: subtotal - discountAmount
  };
};

const addProductToCart = (product) => {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
    return;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1
  });
};

// 1. Dashboard Page Controller
export const renderDashboardPage = async (req, res) => {
  try {
    const products = await Product.findAll();
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalSales = transactionHistory.reduce((acc, tx) => acc + tx.totalAmount, 0);

    res.render("dashboard", {
      title: "XianFire POS - Dashboard",
      totalProducts,
      totalStock,
      totalSales: totalSales.toFixed(2),
      recentTransactions: transactionHistory.slice(0, 5)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading dashboard page.");
  }
};

// 2. POS Catalog & Shopping Cart Controller
export const renderProductsPage = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let products;

    if (searchQuery) {
      products = await Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchQuery}%` } },
            { sku: { [Op.like]: `%${searchQuery}%` } }
          ]
        }
      });
    } else {
      products = await Product.findAll();
    }
    
    const { subtotal, discountAmount, totalAmount } = getCartTotals();
    const customers = await User.findAll({
      where: { role: "visitors" },
      attributes: ["id", "name", "email"],
      order: [["name", "ASC"]]
    });
    
    res.render("POS SupplyHub/product", { 
      title: req.path === "/dashboard" ? "POS Dashboard" : "XianFire POS - Terminal",
      isPosPage: true,
      isPosDashboard: req.path === "/dashboard",
      products,
      cart,
      customers,
      checkoutError: req.query.checkoutError || "",
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      discountValue: cartDiscount.value || "",
      discountIsAmount: cartDiscount.type === "amount",
      discountIsPercent: cartDiscount.type === "percent",
      searchQuery
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading POS page.");
  }
};

// 3. Product Management Page Controller (Hiwalay na pahina para sa Products)
export const renderProductManagementPage = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.render("POS SupplyHub/product-management", {
      title: "XianFire POS - Product Management",
      isPosPage: true,
      productError: req.query.error || "",
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading product management page.");
  }
};

// 4. Create Product (Redirect sa product-management page)
export const createProduct = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const sku = typeof req.body.sku === "string" ? req.body.sku.trim() : "";
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);
    if (!name || !sku || name.length > 255 || sku.length > 255
      || !Number.isFinite(price) || price < 0
      || !Number.isInteger(stock) || stock < 0) {
      return res.redirect(`/pos/product-management?error=${encodeURIComponent("Enter a product name, unique SKU, valid price, and whole-number stock of zero or more.")}`);
    }
    await Product.create({ name, sku, price, stock });
    res.redirect("/pos/product-management");
  } catch (error) {
    console.error(error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.redirect(`/pos/product-management?error=${encodeURIComponent("That SKU is already in use. Enter a unique SKU.")}`);
    }
    res.status(500).send("Error creating product. Check the server logs for details.");
  }
};

// 5. Apply a discount to the current cart
export const applyDiscount = (req, res) => {
  const value = Number(req.body.discountValue);
  const type = req.body.discountType;

  if (!Number.isFinite(value) || value < 0 || !["amount", "percent"].includes(type)) {
    return res.status(400).send("Enter a valid discount amount or percentage.");
  }
  if (type === "percent" && value > 100) {
    return res.status(400).send("Percentage discount cannot exceed 100%.");
  }
  if (cart.length === 0) {
    return res.status(400).send("Add an item to the cart before applying a discount.");
  }

  cartDiscount = { value, type };
  res.redirect("/pos/products");
};

// 6. Add to Cart
export const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);

    if (product) {
      addProductToCart(product);
    }
    res.redirect("/pos/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding product to cart.");
  }
};

export const scanProduct = async (req, res) => {
  try {
    const scanValue = req.body.barcode?.trim();
    if (!scanValue) return res.redirect("/pos/products");

    const product = await Product.findOne({
      where: {
        [Op.or]: [
          { sku: scanValue },
          { name: scanValue }
        ]
      }
    });
    if (product) {
      addProductToCart(product);
      return res.redirect("/pos/products");
    }

    const matchingProducts = await Product.findAll({
      where: {
        [Op.or]: [
          { sku: { [Op.like]: `%${scanValue}%` } },
          { name: { [Op.like]: `%${scanValue}%` } }
        ]
      },
      limit: 2
    });
    if (matchingProducts.length === 1) {
      addProductToCart(matchingProducts[0]);
      return res.redirect("/pos/products");
    }

    res.redirect(`/pos/products?search=${encodeURIComponent(scanValue)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error scanning product barcode.");
  }
};

// 7. Quantity Increase
export const increaseCartQuantity = async (req, res) => {
  const productId = req.params.id;
  const item = cart.find(item => item.id == productId);
  if (item) item.quantity += 1;
  res.redirect("/pos/products");
};

// 8. Quantity Decrease
export const decreaseCartQuantity = async (req, res) => {
  const productId = req.params.id;
  const itemIndex = cart.findIndex(item => item.id == productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity -= 1;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
  }
  if (cart.length === 0) cartDiscount = { value: 0, type: "amount" };
  res.redirect("/pos/products");
};

export const setCartQuantity = (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).send("Quantity must be a whole number greater than zero.");
  }

  const item = cart.find(item => String(item.id) === req.params.id);
  if (!item) return res.status(404).send("That item is no longer in the cart.");
  item.quantity = quantity;
  res.redirect("/pos/products");
};

export const removeCartItem = (req, res) => {
  cart = cart.filter(item => String(item.id) !== req.params.id);
  if (cart.length === 0) cartDiscount = { value: 0, type: "amount" };
  res.redirect("/pos/products");
};

export const clearCart = (req, res) => {
  cart = [];
  cartDiscount = { value: 0, type: "amount" };
  res.redirect("/pos/products");
};

// 9. Checkout Process & Stock Deduction
export const processCheckout = async (req, res) => {
  try {
    if (cart.length === 0) return res.redirect("/pos/products");

    const { subtotal, discountAmount, totalAmount } = getCartTotals();
    const paymentMethod = req.body.paymentMethod;
    const validPaymentMethods = ["cash", "gcash", "maya", "credit-card"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).send("Choose a valid payment method.");
    }

    let customerName = "Walking Customer";
    if (req.body.customerId) {
      const customer = await User.findOne({
        where: { id: req.body.customerId, role: "visitors" },
        attributes: ["id", "name"]
      });
      if (!customer) return res.status(400).send("Choose a registered customer.");
      customerName = customer.name;
    }

    const amountTendered = paymentMethod === "cash"
      ? Number(req.body.amountTendered)
      : totalAmount;
    if (!Number.isFinite(amountTendered) || amountTendered < totalAmount) {
      return res.status(400).send("Amount tendered must cover the order total.");
    }

    await sequelize.transaction(async (dbTransaction) => {
      for (const item of cart) {
        const product = await Product.findByPk(item.id, {
          transaction: dbTransaction,
          lock: dbTransaction.LOCK.UPDATE
        });
        if (!product) {
          const error = new Error(`${item.name} is no longer available.`);
          error.statusCode = 409;
          throw error;
        }

        const availableStock = Number(product.stock);
        if (!Number.isInteger(availableStock) || availableStock < item.quantity) {
          const error = new Error(`Not enough stock for ${item.name}. Available: ${availableStock}.`);
          error.statusCode = 409;
          throw error;
        }

        await product.update(
          { stock: availableStock - item.quantity },
          { transaction: dbTransaction }
        );
      }
    });

    const itemsSummaryText = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
    transactionHistory.unshift({
      id: transactionHistory.length + 1,
      itemsSummary: itemsSummaryText,
      customerName,
      subtotal,
      discountAmount,
      totalAmount,
      paymentMethod,
      amountTendered,
      change: paymentMethod === "cash" ? amountTendered - totalAmount : 0,
      cashier: "Ali (Admin)",
      createdAt: new Date().toLocaleString()
    });

    cart = [];
    cartDiscount = { value: 0, type: "amount" };
    res.redirect("/pos/reports");
  } catch (error) {
    console.error(error);
    if (error.statusCode === 409) {
      return res.redirect(`/pos/products?checkoutError=${encodeURIComponent(error.message)}`);
    }
    res.status(500).send("Error processing checkout.");
  }
};

// 10. Sales Reports and History Page
export const renderReportsPage = async (req, res) => {
  try {
    const totalSales = transactionHistory.reduce((acc, tx) => acc + tx.totalAmount, 0);
    res.render("POS SupplyHub/reports", {
      title: "XianFire POS - Sales Reports",
      isPosPage: true,
      transactions: transactionHistory,
      totalSales: totalSales.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading sales reports.");
  }
};

// 11. Delete Product (Redirect pabalik sa product-management page)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.destroy({ where: { id } });
    res.redirect("/pos/product-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting product.");
  }
};