import passport from "passport";
import { OIDCStrategy } from "passport-azure-ad";
import prismaClient from "../prisma/prisma"; // singleton only

/**
 * Microsoft OIDC strategy.
 * Registered ONLY when the required env vars are present.
 */
if (
  process.env.MICROSOFT_CLIENT_ID &&
  process.env.MICROSOFT_CLIENT_SECRET &&
  process.env.MICROSOFT_CALLBACK_URL
) {
  passport.use(
    new OIDCStrategy(
      {
        identityMetadata:
          "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        responseType: "code",
        responseMode: "query",
        redirectUrl: process.env.MICROSOFT_CALLBACK_URL,
        allowHttpForRedirectUrl: true,
        validateIssuer: false,
        passReqToCallback: false,
        scope: ["profile", "email", "openid"],
      },
      async (iss: any, sub: any, profile: any, _accessToken: any, _refreshToken: any, done: any) => {
        try {
          const email =
            profile._json?.preferred_username || profile._json?.email;
          if (!email) return done(new Error("No email from Microsoft"), false);

          let user = await prismaClient.user.findUnique({ where: { email } });
          if (!user) {
            user = await prismaClient.user.create({
              data: {
                fullName: profile.displayName || "Microsoft User",
                email,
                authProvider: "MICROSOFT",
                providerId: profile.oid,
                isEmailVerified: true,
              },
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
}

export default passport;