import { SignUp } from "@clerk/nextjs";
import { AuthPageToolbar } from "@/components/theme/auth-page-toolbar";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <AuthPageToolbar />
      <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </div>
  );
}
