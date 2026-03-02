// export { default } from "next-auth/middleware";

// export const config = {
//   matcher: ["/pricing", "/chat", "/settings"],
// };

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/pricing/:path*", "/chat/:path*", "/settings/:path*"],
};