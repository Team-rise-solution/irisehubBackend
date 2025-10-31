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
dotenv.config({ 
    silent: true  // This will suppress the dotenv messages
})

//app config
const app = express()
const port = process.env.PORT || 5000


//middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cors({
    origin: process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(',')
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
})

