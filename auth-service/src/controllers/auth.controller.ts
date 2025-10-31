import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { signUpSchema, loginSchema } from '../schemas/auth.schema';
import { db } from '../lib/db';
import { generateToken } from '../utils/jwt.utils';

export const register = async (req: Request, res: Response) => {
  try {
    console.log('\n🔷🔷🔷 REGISTER CONTROLLER START 🔷🔷🔷');

    const body = req.body;
    console.log('📝 Validating registration data...');
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      console.log('❌ Validation failed:', result.error.issues);
      return res.status(400).json({
        error: 'Missing fields, Wrong Data',
        details: result.error.issues
      });
    }
    console.log('✅ Validation passed');

    const { email, password, username } = result.data;
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);

    // Check if username exists
    console.log('🔍 Checking if username exists...');
    const existedUsername = await db.user.findUnique({
      where: { username },
    });

    if (existedUsername) {
      console.log('❌ Username already taken');
      return res.status(409).json({ error: 'Username is already taken' });
    }
    console.log('✅ Username available');

    // Check if email exists
    console.log('🔍 Checking if email exists...');
    const existedUser = await db.user.findUnique({
      where: { email },
    });

    if (existedUser) {
      console.log('❌ Email already taken');
      return res.status(409).json({ error: 'Email is already taken' });
    }
    console.log('✅ Email available');

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Create user
    console.log('💾 Creating user in database...');
    const newUser = await db.user.create({
      data: {
        username,
        email,
        hashedPassword,
        completedOnboarding: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        surname: true,
        image: true,
        completedOnboarding: true,
      },
    });
    console.log(`✅ User created successfully with ID: ${newUser.id}`);

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });
    console.log('✅ JWT token generated');

    console.log('🎉 Registration completed successfully!');
    console.log('🔷🔷🔷 REGISTER CONTROLLER END (SUCCESS) 🔷🔷🔷\n');

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('❌❌❌ Registration error:', error);
    console.log('🔷🔷🔷 REGISTER CONTROLLER END (ERROR) 🔷🔷🔷\n');
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('\n🔷🔷🔷 LOGIN CONTROLLER START 🔷🔷🔷');

    const body = req.body;
    console.log('📝 Validating login credentials...');
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      console.log('❌ Validation failed:', result.error.issues);
      return res.status(400).json({
        error: 'Invalid credentials format',
        details: result.error.issues
      });
    }
    console.log('✅ Validation passed');

    const { email, password } = result.data;
    console.log(`📧 Attempting login for email: ${email}`);

    // Find user
    console.log('🔍 Looking up user in database...');
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        surname: true,
        image: true,
        hashedPassword: true,
        completedOnboarding: true,
      },
    });

    if (!user || !user.hashedPassword) {
      console.log('❌ User not found or has no password');
      return res.status(401).json({
        error: 'User was not found, Please enter valid email'
      });
    }
    console.log(`✅ User found: ${user.username} (${user.id})`);

    // Verify password
    console.log('🔐 Verifying password...');
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordMatch) {
      console.log('❌ Password verification failed');
      return res.status(401).json({
        error: 'The entered password is incorrect, please enter the correct one.'
      });
    }
    console.log('✅ Password verified successfully');

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    console.log('✅ JWT token generated');

    // Remove password from response
    const { hashedPassword, ...userWithoutPassword } = user;

    console.log('🎉 Login completed successfully!');
    console.log(`  Onboarding Status: ${user.completedOnboarding ? '✅ Completed' : '⏳ Pending'}`);
    console.log('🔷🔷🔷 LOGIN CONTROLLER END (SUCCESS) 🔷🔷🔷\n');

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('❌❌❌ Login error:', error);
    console.log('🔷🔷🔷 LOGIN CONTROLLER END (ERROR) 🔷🔷🔷\n');
    res.status(500).json({ error: 'Something went wrong during login' });
  }
};

export const callback = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    // This endpoint would handle OAuth callbacks
    // For now, we'll return a placeholder
    res.status(200).json({
      message: `OAuth callback for ${provider}`,
      // In production, this would handle the OAuth flow
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
};

export const providers = async (req: Request, res: Response) => {
  try {
    const availableProviders = [
      {
        id: 'google',
        name: 'Google',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      {
        id: 'github',
        name: 'GitHub',
        enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
      {
        id: 'apple',
        name: 'Apple',
        enabled: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
      },
      {
        id: 'credentials',
        name: 'Email/Password',
        enabled: true,
      },
    ];

    res.status(200).json({ providers: availableProviders });
  } catch (error) {
    console.error('Providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
};
