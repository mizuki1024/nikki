import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";


// 認証の設定
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

// NextAuth の API エンドポイントを設定
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
