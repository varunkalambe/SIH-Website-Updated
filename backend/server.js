// server.js

// ===== IMPORT REQUIRED MODULES =====
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";

// Import database connection
import connectDB from "./config/db.js";

// Import route handlers
import uploadRoutes from "./routes/uploadRoutes.js";
import streamRoutes from "./routes/streamRoutes.js"; 
import processRoutes from "./routes/processRoutes.js";

// ===== INITIALIZE ENVIRONMENT AND DATABASE =====
dotenv.config();
connectDB();

const app = express();

// ===== MIDDLEWARE SETUP =====

// Enable CORS for frontend (running outside backend folder)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "HEAD", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Range", "Accept-Ranges", "Authorization"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
    credentials: true
}));

// Parse JSON requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== DIRECTORY SETUP =====
// Ensure upload directories exist
const uploadDirs = [
    'uploads',
    'uploads/originals',
    'uploads/audio',
    'uploads/translated_audio',
    'uploads/captions',
    'uploads/transcripts',
    'uploads/processed'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// ===== STATIC FILE SERVING =====
// Serve uploaded videos and processed files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res, filePath) => {
        // Set proper headers for video files
        if (filePath.endsWith('.mp4') || filePath.endsWith('.avi') || filePath.endsWith('.mov')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
        // Set proper headers for audio files
        if (filePath.endsWith('.wav') || filePath.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        }
        // Set proper headers for caption files
        if (filePath.endsWith('.vtt')) {
            res.setHeader('Content-Type', 'text/vtt');
        }
    }
}));

// ===== REQUEST LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
    next();
});

// ===== API ROUTES =====
app.use("/api/upload", uploadRoutes);
app.use("/uploads", streamRoutes);
app.use("/api/process", processRoutes);

// ===== ROOT ENDPOINT =====
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Video Translation API Server",
        version: "1.0.0",
        endpoints: {
            upload: "/api/upload",
            process: "/api/process", 
            stream: "/uploads",
            health: "/api/process/health"
        },
        features: [
            "Video Upload & Processing",
            "Audio Extraction with FFmpeg",
            "Speech-to-Text Transcription", 
            "Text Translation",
            "Text-to-Speech Generation",
            "Caption Generation",
            "Video Assembly",
            "Real-time Processing Status"
        ],
        timestamp: new Date()
    });
});

// ===== API INFO ENDPOINT =====
app.get("/api", (req, res) => {
    res.json({
        success: true,
        api: "Video Translation Processing API",
        version: "1.0.0",
        routes: {
            "POST /api/upload": "Upload video file for processing",
            "GET /api/process/status/:jobId": "Get processing status",
            "GET /api/process/jobs": "List all processing jobs",
            "GET /api/process/stats": "Get processing statistics",
            "POST /api/process/jobs/:jobId/cancel": "Cancel a processing job",
            "DELETE /api/process/jobs/:jobId": "Delete a processing job",
            "GET /api/process/health": "System health check",
            "GET /uploads/:filename": "Stream uploaded/processed files"
        },
        documentation: "Visit /api/docs for detailed API documentation",
        timestamp: new Date()
    });
});

// ===== HEALTH CHECK ENDPOINT =====
app.get("/health", async (req, res) => {
    try {
        res.json({
            success: true,
            status: "Server is healthy",
            uptime: process.uptime(),
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            version: "1.0.0",
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: "Server unhealthy",
            error: error.message,
            timestamp: new Date()
        });
    }
});

// ===== ERROR HANDLING MIDDLEWARE =====

// 404 Handler - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
        message: `The requested endpoint ${req.method} ${req.url} does not exist`,
        availableRoutes: [
            "GET /",
            "GET /api",
            "GET /health",
            "POST /api/upload",
            "GET /api/process/status/:jobId",
            "GET /api/process/jobs",
            "GET /api/process/stats",
            "GET /api/process/health",
            "GET /uploads/:filename"
        ],
        timestamp: new Date()
    });
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error('🔥 Server Error:', error);
    
    // Handle specific error types
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: "File too large",
            message: "The uploaded file exceeds the maximum size limit",
            maxSize: "50MB"
        });
    }
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: "Validation Error",
            message: error.message
        });
    }
    
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: "Invalid ID",
            message: "The provided ID is not valid"
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? 
            "Something went wrong on the server" : 
            error.message,
        timestamp: new Date()
    });
});

// ===== GRACEFUL SHUTDOWN HANDLING =====
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close database connections
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.log('⚠️  Forcing shutdown after 10 seconds');
        process.exit(1);
    }, 10000);
};

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Upload directories initialized`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API info: http://localhost:${PORT}/api`);
    
    // Log environment info
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Node.js version: ${process.version}`);
    console.log(`⚡ Ready for video processing requests!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// ===== EXPORT APP FOR TESTING =====
export default app;
