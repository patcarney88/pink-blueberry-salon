/**
 * Password Reset API Route for Pink Blueberry Salon
 * Handles password reset request and reset processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { emailService } from '@/lib/auth/email';
import { db } from '@/lib/db/client';

/**
 * POST /api/auth/reset-password
 * Request password reset email
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
        { message: 'If an account with that email exists, a password reset email has been sent.' },
        { status: 200 }
      );
    }

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is locked. Please contact support.' },
        { status: 400 }
      );
    }

    // Send password reset email
    const result = await emailService.sendPasswordResetEmail(
      user.id,
      user.email,
      user.first_name
    );

    if (result.success) {
      // Log security event
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          metadata: {
            email: user.email,
          },
        },
      });

      return NextResponse.json(
        { message: 'Password reset email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/reset-password
 * Reset password using token
 */
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Verify reset token
    const tokenResult = await emailService.verifyResetToken(token);

    if (!tokenResult.success || !tokenResult.userId) {
      return NextResponse.json(
        { error: tokenResult.error || 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: tokenResult.userId },
    });

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'User not found or account is locked' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hash(password, 12);

    // Update password and clear reset token
    const metadata = user.metadata as any;
    await db.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        metadata: {
          ...metadata,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      },
    });

    // Log security event
    await db.auditLog.create({
      data: {
        user_id: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          email: user.email,
        },
      },
    });

    // Optionally, invalidate all existing sessions for security
    await db.session.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}