/**
 * Email Verification API Route for Pink Blueberry Salon
 * Handles email verification token processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/auth/email';
import { db } from '@/lib/db/client';

/**
 * GET /api/auth/verify-email
 * Verify email address using token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/error?error=MissingVerificationToken', request.url)
      );
    }

    // Verify the token
    const result = await emailService.verifyEmailToken(token);

    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(
        new URL('/auth/verify-success?verified=true', request.url)
      );
    } else {
      // Redirect to error page with specific error
      const errorCode = result.error?.includes('expired') ? 'TokenExpired' : 'InvalidToken';
      return NextResponse.redirect(
        new URL(`/auth/error?error=${errorCode}`, request.url)
      );
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=VerificationFailed', request.url)
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deleted_at: null,
      },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a verification email has been sent.' },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Send verification email
    const result = await emailService.sendVerificationEmail(
      user.id,
      user.email,
      user.first_name
    );

    if (result.success) {
      return NextResponse.json(
        { message: 'Verification email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}