import { Router } from "express";
import { 
  renderProductsPage, 
  renderProductManagementPage, // Added for Product Management page
  createProduct, 
  deleteProduct, 
  processCheckout,
  applyDiscount,
  addToCart,
  scanProduct,
  increaseCartQuantity,  // Added for (+) cart button
  decreaseCartQuantity,  // Added for (-) cart button
  renderReportsPage,
  setCartQuantity,
  removeCartItem,
  clearCart
} from "../../controllers/POS SupplyHub/productcontroller.js";

const router = Router();

// Dashboard route
router.get("/", renderProductsPage);
router.get("/dashboard", renderProductsPage);

// Get and display the products / POS page
router.get("/products", renderProductsPage);

// Product Management page route
router.get("/product-management", renderProductManagementPage);

// Process adding a new product from the form
router.post("/products", createProduct);

// Delete a product based on its ID
router.post("/products/delete/:id", deleteProduct);

// Add a product to the cart
router.post("/cart/add/:id", addToCart);
router.post("/cart/scan", scanProduct);
router.post("/cart/clear", clearCart);
router.post("/cart/quantity/:id", setCartQuantity);
router.post("/cart/remove/:id", removeCartItem);

// Increase and Decrease cart item quantity routes
router.post("/cart/increase/:id", increaseCartQuantity);
router.post("/cart/decrease/:id", decreaseCartQuantity);

// Apply a fixed-amount or percentage discount to the current cart
router.post("/apply-discount", applyDiscount);

// Process checkout
router.post("/checkout", processCheckout);

// Sales Reports and History route
router.get("/reports", renderReportsPage);

export default router;