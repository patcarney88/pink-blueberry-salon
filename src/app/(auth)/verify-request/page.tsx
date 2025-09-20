/**
 * Email Verification Request Page for Pink Blueberry Salon
 * Shows after successful registration or magic link request
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'verification'; // verification, magic-link, reset

  const getTitle = () => {
    switch (type) {
      case 'magic-link':
        return 'Check Your Email';
      case 'reset':
        return 'Reset Link Sent';
      default:
        return 'Verify Your Email';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'magic-link':
        return 'We sent a magic link to your email address. Click the link to sign in instantly.';
      case 'reset':
        return 'We sent a password reset link to your email address. Click the link to reset your password.';
      default:
        return 'We sent a verification link to your email address. Click the link to verify your account and complete your registration.';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'magic-link':
      case 'reset':
        return <Mail className="h-8 w-8 text-pink-600" />;
      default:
        return <CheckCircle className="h-8 w-8 text-green-600" />;
    }
  };

  return (
    <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          {getIcon()}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTitle()}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {getDescription()}
        </p>
        {email && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sent to: <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            What to do next:
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Check your email inbox</li>
            <li>Look for an email from Pink Blueberry Salon</li>
            <li>Click the link in the email</li>
            {type === 'verification' && <li>Complete your account setup</li>}
            {type === 'magic-link' && <li>You'll be automatically signed in</li>}
            {type === 'reset' && <li>Create a new password</li>}
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Didn't receive the email?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email address</li>
            <li>• Wait a few minutes - emails can take time to arrive</li>
            <li>• Try adding our email to your safe senders list</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            Resend Email
          </Button>

          <Link href="/auth/signin">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        {/* Help */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Still having trouble?{' '}
            <Link href="/contact" className="text-pink-600 hover:text-pink-500">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
}