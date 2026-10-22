-- Allow one user to link more than one OAuth provider (Google + GitHub).
DROP INDEX "Account_userId_key";

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
