/**
 * Email Service for Pink Blueberry Salon Authentication
 * Handles email verification, password reset, and magic links
 */

import nodemailer from 'nodemailer';
import { db } from '@/lib/db/client';
import { JWTManager } from './jwt';
import { randomBytes } from 'crypto';

/**
 * Email configuration
 */
const emailConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

/**
 * Email templates
 */
const emailTemplates = {
  verification: {
    subject: 'Verify your Pink Blueberry Salon account',
    html: (name: string, verificationUrl: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Pink Blueberry Salon!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for creating an account with Pink Blueberry Salon. To complete your registration and access all features, please verify your email address.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Pink Blueberry Salon. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  passwordReset: {
    subject: 'Reset your Pink Blueberry Salon password',
    html: (name: string, resetUrl: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password for your Pink Blueberry Salon account.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <div class="warning">
                <p><strong>⚠️ Important Security Information:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>The link can only be used once</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will remain unchanged until you use this link</li>
                </ul>
              </div>
              <p>If you continue to have problems, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Pink Blueberry Salon. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  magicLink: {
    subject: 'Your Pink Blueberry Salon sign-in link',
    html: (name: string, signInUrl: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Sign In to Your Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sign In to Pink Blueberry Salon</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Click the button below to sign in to your Pink Blueberry Salon account:</p>
              <a href="${signInUrl}" class="button">Sign In</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${signInUrl}</p>
              <p><strong>This link will expire in 15 minutes.</strong></p>
              <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Pink Blueberry Salon. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};

/**
 * Email Service class
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter(emailConfig);
    }
    return this.transporter;
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate verification token
      const verificationToken = JWTManager.generateVerificationToken(userId, email);

      // Store token in database
      await db.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...((await db.user.findUnique({ where: { id: userId } }))?.metadata as any) || {},
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      });

      // Generate verification URL
      const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

      // Send email
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: `"Pink Blueberry Salon" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: emailTemplates.verification.subject,
        html: emailTemplates.verification.html(firstName, verificationUrl),
      });

      return { success: true };
    } catch (error) {
      console.error('Send verification email error:', error);
      return {
        success: false,
        error: 'Failed to send verification email',
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userId: string,
    email: string,
    firstName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate reset token
      const resetToken = JWTManager.generateResetToken(userId, email);

      // Store token in database
      await db.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...((await db.user.findUnique({ where: { id: userId } }))?.metadata as any) || {},
            passwordResetToken: resetToken,
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        },
      });

      // Generate reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

      // Send email
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: `"Pink Blueberry Salon" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: emailTemplates.passwordReset.subject,
        html: emailTemplates.passwordReset.html(firstName, resetUrl),
      });

      return { success: true };
    } catch (error) {
      console.error('Send password reset email error:', error);
      return {
        success: false,
        error: 'Failed to send password reset email',
      };
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(
    email: string,
    firstName: string,
    callbackUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find user
      const user = await db.user.findFirst({
        where: { email: email.toLowerCase(), deleted_at: null },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate magic link token
      const magicToken = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store token in database
      await db.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...((user.metadata as any) || {}),
            magicLinkToken: magicToken,
            magicLinkExpires: expires,
          },
        },
      });

      // Generate sign-in URL
      const signInUrl = `${process.env.NEXTAUTH_URL}/api/auth/magic-link?token=${magicToken}&callbackUrl=${encodeURIComponent(callbackUrl || '/dashboard')}`;

      // Send email
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: `"Pink Blueberry Salon" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: emailTemplates.magicLink.subject,
        html: emailTemplates.magicLink.html(firstName, signInUrl),
      });

      return { success: true };
    } catch (error) {
      console.error('Send magic link email error:', error);
      return {
        success: false,
        error: 'Failed to send magic link email',
      };
    }
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Verify JWT token
      const decoded = JWTManager.verifyToken(token);

      if (!decoded || decoded.tokenType !== 'verification') {
        return {
          success: false,
          error: 'Invalid verification token',
        };
      }

      // Find user and verify token
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const metadata = user.metadata as any;
      if (metadata?.emailVerificationToken !== token) {
        return {
          success: false,
          error: 'Invalid verification token',
        };
      }

      if (new Date() > new Date(metadata.emailVerificationExpires)) {
        return {
          success: false,
          error: 'Verification token expired',
        };
      }

      // Mark email as verified
      await db.user.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          metadata: {
            ...metadata,
            emailVerificationToken: null,
            emailVerificationExpires: null,
          },
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'EMAIL_VERIFIED',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            email: user.email,
          },
        },
      });

      return {
        success: true,
        userId: user.id,
      };
    } catch (error) {
      console.error('Verify email token error:', error);
      return {
        success: false,
        error: 'Email verification failed',
      };
    }
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Verify JWT token
      const decoded = JWTManager.verifyToken(token);

      if (!decoded || decoded.tokenType !== 'reset') {
        return {
          success: false,
          error: 'Invalid reset token',
        };
      }

      // Find user and verify token
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const metadata = user.metadata as any;
      if (metadata?.passwordResetToken !== token) {
        return {
          success: false,
          error: 'Invalid reset token',
        };
      }

      if (new Date() > new Date(metadata.passwordResetExpires)) {
        return {
          success: false,
          error: 'Reset token expired',
        };
      }

      return {
        success: true,
        userId: user.id,
      };
    } catch (error) {
      console.error('Verify reset token error:', error);
      return {
        success: false,
        error: 'Token verification failed',
      };
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLinkToken(token: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Find user by token
      const user = await db.user.findFirst({
        where: {
          deleted_at: null,
          // This is simplified - in production, store tokens in separate table
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid magic link',
        };
      }

      const metadata = user.metadata as any;
      if (metadata?.magicLinkToken !== token) {
        return {
          success: false,
          error: 'Invalid magic link',
        };
      }

      if (new Date() > new Date(metadata.magicLinkExpires)) {
        return {
          success: false,
          error: 'Magic link expired',
        };
      }

      // Clear token
      await db.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...metadata,
            magicLinkToken: null,
            magicLinkExpires: null,
          },
          last_login: new Date(),
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'MAGIC_LINK_LOGIN',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            email: user.email,
          },
        },
      });

      return {
        success: true,
        userId: user.id,
      };
    } catch (error) {
      console.error('Verify magic link token error:', error);
      return {
        success: false,
        error: 'Magic link verification failed',
      };
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('Email config test error:', error);
      return {
        success: false,
        error: 'Email configuration test failed',
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();