import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prismaClient from "../prisma/prisma"; // singleton only

/**
 * Google OAuth strategy.
 * Registered ONLY when the required env vars are present so the app
 * starts safely in environments without OAuth credentials.
 */
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"), false);

          let user = await prismaClient.user.findUnique({ where: { email } });
          if (!user) {
            user = await prismaClient.user.create({
              data: {
                fullName: profile.displayName,
                email,
                profilePicture: profile.photos?.[0]?.value,
                authProvider: "GOOGLE",
                providerId: profile.id,
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