import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('serviceloop');
    const business = await db.collection('businesses').findOne({ ownerId: uid });

    if (business) {
      return NextResponse.json({ exists: true, business });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerId, businessName, ownerName, businessType, location, phone, email } = body;

    if (!ownerId || !businessName || !ownerName || !businessType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('serviceloop');

    const newBusiness = {
      ownerId,
      businessName,
      ownerName,
      businessType,
      location: location || 'India',
      phone: phone || '',
      email: email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('businesses').updateOne(
      { ownerId },
      { $set: newBusiness },
      { upsert: true }
    );

    return NextResponse.json({ success: true, id: result.upsertedId || ownerId }, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
