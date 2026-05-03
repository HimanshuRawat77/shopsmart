const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// ─── Database Configuration ──────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }
    : false
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// In-memory cart: { productId: quantity }
// (Note: For a full production app, this would also be moved to the database)
let cart = {};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShopSmart Backend is running', timestamp: new Date().toISOString() });
});

// GET all products (with optional category filter)
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  try {
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (category) {
      query += ' WHERE LOWER(category) = LOWER($1)';
      params.push(category);
    }
    
    const { rows } = await pool.query(query);
    res.json({ products: rows, total: rows.length });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by id
app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET all unique categories
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products');
    const categories = rows.map(r => r.category);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET cart (with full product info)
app.get('/api/cart', async (req, res) => {
  try {
    const productIds = Object.keys(cart);
    if (productIds.length === 0) {
      return res.json({ items: [], total: 0, count: 0 });
    }

    const { rows } = await pool.query('SELECT * FROM products WHERE id = ANY($1)', [productIds]);
    
    const items = rows.map(product => ({
      ...product,
      quantity: cart[product.id]
    }));

    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    res.json({ items, total, count: items.reduce((s, i) => s + i.quantity, 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart details' });
  }
});

// POST add item to cart
app.post('/api/cart', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  try {
    const { rows } = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    cart[productId] = (cart[productId] || 0) + quantity;
    res.json({ message: 'Added to cart', productId, quantity: cart[productId] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE remove item from cart
app.delete('/api/cart/:productId', (req, res) => {
  const { productId } = req.params;
  if (!cart[productId]) return res.status(404).json({ error: 'Item not in cart' });
  delete cart[productId];
  res.json({ message: 'Removed from cart', productId });
});

// DELETE clear entire cart
app.delete('/api/cart', (req, res) => {
  cart = {};
  res.json({ message: 'Cart cleared' });
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all to serve index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
