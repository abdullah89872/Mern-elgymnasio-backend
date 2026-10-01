const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const registrationRoutes = require('./routes/registration.routes');
const adminRoutes = require('./routes/admin.routes');
const memberRoutes = require('./routes/member.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const paymentRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');
const contactRoutes = require('./routes/contact.routes');

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// =================== MIDDLEWARE ===================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('dev'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =================== ROUTES ===================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/contact', contactRoutes);

// =================== BASIC ENDPOINTS ===================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    service: 'EL GYMNASIO Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    database: 'Connected',
    environment: process.env.NODE_ENV
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to EL GYMNASIO Gym Management System API',
    owner: 'Malik Muhammad Azlan',
    contact: '+92 324 0145654',
    email: 'Elgynasio@gmail.com',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile'
      },
      admin: {
        members: {
          getAll: 'GET /api/admin/members',
          add: 'POST /api/admin/members',
          getById: 'GET /api/admin/members/:id'
        },
        trainers: {
          getAll: 'GET /api/admin/trainers',
          add: 'POST /api/admin/trainers'
        },
        nutritionists: {
          getAll: 'GET /api/admin/nutritionists',
          add: 'POST /api/admin/nutritionists'
        },
        dashboard: 'GET /api/admin/dashboard'
      },
      members: {
        profile: 'GET /api/members/profile',
        attendance: 'GET /api/members/attendance',
        payments: 'GET /api/members/payments',
        overview: 'GET /api/members/overview'
      },
      attendance: {
        mark: 'POST /api/attendance/mark (admin)',
        myAttendance: 'GET /api/attendance/my-attendance (member)',
        report: 'GET /api/attendance/report (admin)'
      },
      payments: {
        process: 'POST /api/payments/process',
        myPayments: 'GET /api/payments/my-payments (member)',
        getAll: 'GET /api/payments (admin)'
      }
    },
    documentation: 'For detailed API documentation, contact system administrator'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏋️‍♂️ Welcome to EL GYMNASIO Gym Management System',
    description: 'A comprehensive gym management solution for Pakistan',
    features: [
      'Member Management',
      'Attendance Tracking',
      'Payment Processing (Easypaisa/Jazzcash)',
      'Trainer & Nutritionist Management',
      'Detailed Analytics & Reports'
    ],
    owner: {
      name: 'Malik Muhammad Azlan',
      phone: '+92 324 0145654',
      email: 'Elgynasio@gmail.com',
      location: 'Kahna Nau, Lahore, Pakistan'
    },
    quickLinks: {
      apiDocs: '/api',
      healthCheck: '/health',
      github: 'https://github.com/elgymnasio'
    }
  });
});

// =================== ERROR HANDLING ===================

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    suggestedRoutes: [
      '/api',
      '/health',
      '/api/auth/login',
      '/api/auth/register'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err.details
    } : {},
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// =================== SERVER START ===================

const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || '0.0.0.0';

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🏋️‍♂️  EL GYMNASIO GYM MANAGEMENT SYSTEM                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
  console.log(`🚀 Server Status:        RUNNING`);
  console.log(`🌐 Environment:          ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Server URL:           http://${HOST}:${PORT}`);
  console.log(`🔌 API Base URL:         http://${HOST}:${PORT}/api`);
  console.log(`📊 Health Check:         http://${HOST}:${PORT}/health`);
  console.log(`📚 API Documentation:     http://${HOST}:${PORT}/api`);
  console.log(``);
  console.log(`👤 Owner Information:`);
  console.log(`   Name:                 Malik Muhammad Azlan`);
  console.log(`   Phone:                +92 324 0145654`);
  console.log(`   Email:                Elgynasio@gmail.com`);
  console.log(`   Location:             Kahna Nau, Lahore, Pakistan`);
  console.log(``);
  console.log(`🗄️  Database Status:      ✅ Connected to MongoDB`);
  console.log(`⏰ Server Time:          ${new Date().toLocaleString()}`);
  console.log(``);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`✅ Server is ready to accept connections!`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`
Sample Credentials:
──────────────────────────────────────────────────
Admin Login:
  Email:     admin@elgymnasio.com
  Password:  admin123
  Admin Code: ELGYM2024

Member Login:
  Email:     john@example.com
  Password:  password123
──────────────────────────────────────────────────
`);
});