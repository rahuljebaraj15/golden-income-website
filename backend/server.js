require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for all routes (important for frontend communication)

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => console.error('MongoDB connection error:', err));

// --- User Schema and Model ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    trader_type: { type: String, required: true },
    has_trade_knowledge: { type: Boolean, default: false },
    experience_level: { type: String, required: true },
    minimum_capital: { type: Number, required: true },
    trading_goal: { type: String },
    interests: [{ type: String }],
    referralLink: { type: String, unique: true }, // Store referral link
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const User = mongoose.model('User', userSchema);

// --- API Routes ---

// 1. Register User
app.post('/api/register', async (req, res) => {
    try {
        const {
            name, email, mobile, password,
            trader_type, has_trade_knowledge, experience_level,
            minimum_capital, trading_goal, interests
        } = req.body;

        // Basic validation
        if (!name || !email || !mobile || !password || !trader_type || !experience_level || !minimum_capital) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email or mobile number already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a simple unique referral link (for demo purposes)
        // In a real app, this might be a more complex logic, or come from a broker API
        const generatedReferralLink = `https://your-broker-referral-link.com/ref=${Math.random().toString(36).substring(2, 15)}`;

        const newUser = new User({
            name, email, mobile, password: hashedPassword,
            trader_type, has_trade_knowledge, experience_level,
            minimum_capital, trading_goal, interests,
            referralLink: generatedReferralLink
        });

        await newUser.save();
        
        res.status(201).json({
            message: 'Registration successful! Proceed to your referral link.',
            referralLink: newUser.referralLink // Send the link back
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 2. Login User
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or mobile

        // Find user by email or mobile
        const user = await User.findOne({ $or: [{ email: identifier }, { mobile: identifier }] });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // If login successful, send back the referral link
        res.status(200).json({
            message: 'Login successful! Redirecting to your referral link.',
            referralLink: user.referralLink // Send the stored link
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Fallback route for any other API calls
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});