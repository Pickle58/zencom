import { SignIn } from "@clerk/nextjs";
import { AuthPageToolbar } from "@/components/theme/auth-page-toolbar";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <AuthPageToolbar />
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </div>
  );
}
