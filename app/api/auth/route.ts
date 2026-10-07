import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_serviceloop_2026').digest('hex');
}

function generateUserId(email: string): string {
  return 'user_' + crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, businessName, businessType, location, phone } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const client = await clientPromise;
    const db = client.db('serviceloop');
    const usersCollection = db.collection('auth_users');
    const businessesCollection = db.collection('businesses');

    // 1. REGISTER
    if (action === 'register') {
      if (!password || typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Check if user already exists
      const existing = await usersCollection.findOne({ email: normalizedEmail });
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }

      const uid = generateUserId(normalizedEmail);
      const passwordHash = hashPassword(password);
      const now = new Date().toISOString();

      const newUser = {
        uid,
        email: normalizedEmail,
        passwordHash,
        name: name?.trim() || 'Business Owner',
        createdAt: now,
        updatedAt: now,
      };

      await usersCollection.insertOne(newUser);

      const businessData = {
        ownerId: uid,
        ownerName: name?.trim() || 'Business Owner',
        email: normalizedEmail,
        phone: phone?.trim() || '',
        businessName: businessName?.trim() || 'My Business',
        businessType: businessType?.trim() || 'Services',
        location: location?.trim() || 'India',
        createdAt: now,
        updatedAt: now,
      };

      await businessesCollection.updateOne(
        { ownerId: uid },
        { $set: businessData },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        user: {
          uid,
          email: normalizedEmail,
          displayName: newUser.name,
          isCustomAuth: true,
        },
        business: businessData,
      });
    }

    // 2. LOGIN
    if (action === 'login') {
      if (!password || typeof password !== 'string') {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }

      const user = await usersCollection.findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email. Please register below.' },
          { status: 404 }
        );
      }

      const inputHash = hashPassword(password);
      if (user.passwordHash !== inputHash) {
        return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
      }

      const business = await businessesCollection.findOne({ ownerId: user.uid });

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid as string,
          email: user.email as string,
          displayName: (user.name as string) || 'Business Owner',
          isCustomAuth: true,
        },
        business: business || null,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
