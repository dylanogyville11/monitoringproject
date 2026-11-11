import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SIMON-KONTRAK API Server Running`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Base API    : http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down server...');
  server.close(() => {
    console.log('Server shut down successfully.');
    process.exit(0);
  });
});

export default server;
