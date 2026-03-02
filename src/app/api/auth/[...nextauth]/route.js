import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import connectDB from "@/db/connectDB";
import User from "@/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("Email not found");

        if (!user.password) throw new Error("Use OAuth login");

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isMatch) throw new Error("Wrong password");

        return user;
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      const existingUser = await User.findOne({ email: user.email });

      if (account.provider === "credentials") {
        return true;
      }

      if (existingUser) {
        if (!existingUser.providers.includes(account.provider)) {
          existingUser.providers.push(account.provider);
          await existingUser.save();
        }
        return true;
      }

      await User.create({
        name: user.name,
        email: user.email,
        image: user.image,
        providers: [account.provider],
      });

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user._id;
        token.providers = user.providers;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.providers = token.providers;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };