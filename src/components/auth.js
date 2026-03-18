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

        if (!user.password) throw new Error("Please sign in with Google or GitHub to access your account.");

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
      authorization: {
        params: {
          prompt: "select_account", // This is the magic line
          // access_type: "offline",   // Optional: useful for getting refresh tokens
          // response_type: "code"
        }
      }
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // authorization: {
      //   params: {
      //     prompt: "consent", // to show github page on every request
      //   }
      // }
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
      // if (user) {
      //   token.id = user._id;
      //   token.providers = user.providers;
      // }
      if (token.email) {
        await connectDB();
        const existingUser = await User.findOne({ email: token.email });
        if (!existingUser) return null; 
        token.id = existingUser._id.toString(); 
        token.providers = existingUser.providers;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.providers = token.providers;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};