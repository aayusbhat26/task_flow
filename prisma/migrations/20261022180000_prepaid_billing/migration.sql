-- Prepaid billing: no automatic renewal
ALTER TABLE "User" DROP COLUMN "cancelAtPeriodEnd";
