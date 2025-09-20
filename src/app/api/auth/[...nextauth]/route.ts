/**
 * NextAuth.js API Route for Pink Blueberry Salon
 * Handles all authentication endpoints
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };