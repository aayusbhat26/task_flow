import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, NextAuthOptions } from "next-auth";
import { cache } from "react";
import { db } from "./db";
import { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { generateFromEmail } from "unique-username-generator";
import { userService } from "./userService";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: { timeout: 10000 },
      async profile(profile) {
        const username = generateFromEmail(profile.email, 5);
        return {
          id: profile.sub,
          username,
          name: profile.given_name ? profile.given_name : profile.name,
          surname: profile.family_name ? profile.family_name : "",
          email: profile.email,
          image: profile.picture,
        };
      },
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      async profile(profile) {
        const username = generateFromEmail(profile.email, 5);
        const fullName = profile.name?.split(" ") ?? [];
        return {
          id: profile.id,
          username: profile.login ? profile.login : username,
          name: fullName.at(0),
          surname: fullName.at(1),
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    })
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "text", placeholder: "Email" },
      password: {
        label: "Password",
        type: "password",
        placeholder: "Password",
      },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) {
        throw new Error("Please enter email and password.");
      }

      const user = await db.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });

      if (!user?.hashedPassword) {
        throw new Error("User was not found, please enter a valid email.");
      }

      const passwordMatch = await bcrypt.compare(
        credentials.password,
        user.hashedPassword
      );

      if (!passwordMatch) {
        throw new Error(
          "The entered password is incorrect, please try again."
        );
      }

      return user;
    },
  })
);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/sign-in",
    signIn: "/sign-in",
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
        session.user.surname = token.surname;
        session.user.completedOnboarding = !!token.completedOnboarding;
        session.user.plan = token.plan as string | undefined;
        session.user.planExpiresAt = token.planExpiresAt ?? null;
        session.user.billingInterval = token.billingInterval ?? null;
      }

      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.surname = (user as any).surname;
        token.picture = user.image;
        token.completedOnboarding = !!(user as any).completedOnboarding;
        token.plan = (user as any).plan ?? "FREE";
        token.planExpiresAt =
          (user as any).planExpiresAt?.toISOString?.() ?? null;
        token.billingInterval = (user as any).billingInterval ?? null;
      }

      const needsRefresh =
        trigger === "update" ||
        !token.id ||
        !token.username ||
        token.completedOnboarding === undefined ||
        token.plan === undefined ||
        token.planExpiresAt === undefined;

      if (needsRefresh && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            username: true,
            surname: true,
            image: true,
            completedOnboarding: true,
            plan: true,
            planExpiresAt: true,
            billingInterval: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.surname = dbUser.surname;
          token.picture = dbUser.image;
          token.completedOnboarding = dbUser.completedOnboarding;
          token.plan = dbUser.plan;
          token.planExpiresAt = dbUser.planExpiresAt?.toISOString() ?? null;
          token.billingInterval = dbUser.billingInterval;
        }
      }

      return token;
    },
  },
};

export const getAuthSession = cache(() => getServerSession(authOptions));

export type OAuthProviderAvailability = {
  google: boolean;
  github: boolean;
};

export const getConfiguredOAuthProviders = (): OAuthProviderAvailability => ({
  google: Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ),
  github: Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  ),
});
