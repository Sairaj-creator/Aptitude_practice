import { AuthForm } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <AuthForm mode="forgot" />
    </main>
  );
}
