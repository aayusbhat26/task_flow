import { AuthCard } from "@/components/auth/AuthCard";
import { getConfiguredOAuthProviders } from "@/lib/auth";

const SignIn = () => {
  return (
    <AuthCard signInCard oauthProviders={getConfiguredOAuthProviders()} />
  );
};

export default SignIn;
