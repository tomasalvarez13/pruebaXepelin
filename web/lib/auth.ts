import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';

const isAuthMock = process.env.AUTH_MODE === 'mock';

const providers = isAuthMock
  ? [
      CredentialsProvider({
        name: 'Demo',
        credentials: {},
        async authorize() {
          return { id: 'demo', email: 'demo@xepelin.com', name: 'María González' };
        },
      }),
    ]
  : [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
    ];

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      const backendToken = jwt.sign(
        { email: token.email, name: token.name },
        process.env.JWT_SECRET || 'dev-secret-change-me',
        { expiresIn: '1h' },
      );
      token.backendToken = backendToken;
      return token;
    },
    async session({ session, token }) {
      (session as unknown as Record<string, unknown>).backendToken = token.backendToken;
      return session;
    },
  },
};
