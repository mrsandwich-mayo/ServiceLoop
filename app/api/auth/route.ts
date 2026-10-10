import { NextResponse } from 'next/server';

/**
 * ServiceLoop V1 - Legacy Custom Authentication Route (Decommissioned)
 * Authentication is managed authoritatively by Firebase Authentication.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Legacy custom authentication has been decommissioned in V1. Please authenticate directly using Firebase Authentication.',
      deprecated: true,
    },
    { status: 410 }
  );
}
