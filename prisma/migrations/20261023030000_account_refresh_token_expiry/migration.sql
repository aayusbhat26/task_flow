-- GitHub Apps return expiring user tokens with refresh_token_expires_in,
-- which NextAuth passes to linkAccount.
ALTER TABLE "Account" ADD COLUMN "refresh_token_expires_in" INTEGER;
