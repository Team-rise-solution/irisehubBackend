import mongoose from "mongoose";
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'
import connectCloudinary from "./config/cloudinary.js";
import connectDB from "./config/mongodb.js";
import AdminRoute from "./Routes/AdminRoute.js";
import NewsRoute from "./Routes/NewsRoute.js";
import EventRoute from "./Routes/EventRoute.js";
import BookingRoute from "./Routes/BookingRoute.js";
import StoryRoute from "./Routes/StoryRoute.js";
dotenv.config({ 
    silent: true  // This will suppress the dotenv messages
})

//app config
const app = express()
const port = process.env.PORT || 5000


//middleware
// Note: express.json() and express.urlencoded() should come BEFORE multer routes
// Multer will handle multipart/form-data, so we don't need to parse it here
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// CORS Configuration - Works for both local and production
const allowedOrigins = [
    // Local development URL
    'http://localhost:5173',  // Vite default port
];

// Add production URLs from FRONTEND_URL if set
if (process.env.FRONTEND_URL) {
    const productionUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...productionUrls);
}

// Also allow common Vercel patterns
const vercelPatterns = [
    'https://irisehub-frontend.vercel.app',
    'https://*.vercel.app',
    'https://irisehub-frontend-*.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } 
        // Allow Vercel domains
        else if (origin.includes('vercel.app')) {
            callback(null, true);
        }
        // In development, also allow any localhost origin for flexibility
        else if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
            callback(null, true);
        }
        // In production, only allow exact matches
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            console.warn(`Allowed origins:`, allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition']
}))

app.get('/', (req, res) => {
    res.json({ success: true, message: "Backend is running successfully!" });
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    })
})

console.log( "FRONTEND_URL: is ", process.env.FRONTEND_URL)

// API Routes
app.use("/api/admin", AdminRoute)     // Admin API  
app.use("/api/news", NewsRoute)       // News API
app.use("/api/events", EventRoute)    // Events API
app.use("/api/bookings", BookingRoute) // Bookings API
app.use("/api/stories", StoryRoute)    // Stories API

console.log("✅ Stories API routes registered at /api/stories")


// 404 handler - Must be last
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    })
})

// Connect to services
connectCloudinary()
connectDB()

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`)
    console.log(`📊 Health check: http://localhost:${port}/api/health`)
    console.log(`👤 Admin API: http://localhost:${port}/api/admin`)
    console.log(`📰 News API: http://localhost:${port}/api/news`)
    console.log(`📖 Stories API: http://localhost:${port}/api/stories`)
})

