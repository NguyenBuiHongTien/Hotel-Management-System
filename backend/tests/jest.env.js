// Loaded before any test file — required for createApp() (CORS, JWT middleware checks in routes).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jest-jwt-secret-min-16-chars';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.NODE_ENV = 'test';
