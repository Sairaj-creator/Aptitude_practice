import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <AuthForm mode="signup" />
    </main>
  );
}
