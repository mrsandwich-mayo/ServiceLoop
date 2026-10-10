import { NextResponse } from 'next/server';

/**
 * ServiceLoop V1 - Legacy Business REST Route (Decommissioned)
 * Primary database persistence is managed directly by Cloud Firestore (businesses collection).
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Direct API endpoint decommissioned in V1. All business profiles are retrieved via Cloud Firestore.',
      deprecated: true,
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct API endpoint decommissioned in V1. All business profiles are stored in Cloud Firestore.',
      deprecated: true,
    },
    { status: 410 }
  );
}
