const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key

// Middleware
app.use(cors({ origin: 'http://localhost:5000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/dinelink', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// === Models ===
// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
});
const User = mongoose.model('User', userSchema);

// MenuItem Schema
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    table: { type: String, required: true },
    items: [{
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// === Middleware ===
// Authentication Middleware (for admin routes)
const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// === Routes ===
// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Routes (Admin)
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const activeOrders = await Order.countDocuments({ status: 'active' });
        const completedToday = await Order.countDocuments({
            status: 'completed',
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        const menuItemsCount = await MenuItem.countDocuments();
        const totalSales = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
                }
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        res.json({
            activeOrders,
            completedToday,
            menuItemsCount,
            totalSales: totalSales[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Menu Routes (Admin)
app.get('/api/menu', authMiddleware, async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu', authMiddleware, async (req, res) => {
    try {
        const menuItem = new MenuItem(req.body);
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/menu/:id', authMiddleware, async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/menu/:id', authMiddleware, async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Order Routes (Admin)
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().populate('items.menuItem');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/orders/:id', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Customer Routes
app.get('/api/menu/customer', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ status: 'active' });
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders/customer', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/orders/customer/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId }).populate('items.menuItem');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});