import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import onboardingRoutes from './routes/onboarding.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3003;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📥 [${timestamp}] INCOMING REQUEST`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  🔹 Method: ${req.method}`);
  console.log(`  🔹 URL: ${req.url}`);
  console.log(`  🔹 IP: ${req.ip}`);
  console.log(`  🔹 User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  if (req.headers['x-user-id']) {
    console.log(`  🔹 User ID: ${req.headers['x-user-id']}`);
  }
  if (Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    console.log(`  🔹 Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  console.log(`${'='.repeat(70)}\n`);

  // Log response
  const originalSend = res.send;
  res.send = function(data: any) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📤 [${timestamp}] OUTGOING RESPONSE`);
    console.log(`${'='.repeat(70)}`);
    console.log(`  🔸 Status: ${res.statusCode}`);
    console.log(`  🔸 URL: ${req.url}`);
    const responseData = typeof data === 'string' ? data.substring(0, 300) : JSON.stringify(data).substring(0, 300);
    console.log(`  🔸 Data: ${responseData}${responseData.length >= 300 ? '...' : ''}`);
    console.log(`${'='.repeat(70)}\n`);
    return originalSend.call(this, data);
  };

  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  console.log('✅ Health check endpoint hit');
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('\n' + '█'.repeat(70));
  console.log('� AUTH MICROSERVICE STARTED SUCCESSFULLY');
  console.log('█'.repeat(70));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Service URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`✅ Ready to accept authentication requests`);
  console.log('█'.repeat(70) + '\n');
});

export default app;
