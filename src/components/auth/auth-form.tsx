"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn, signUp, forgotPassword, isSupabaseEnabled } from "@/lib/auth";
import { authSchema, forgotPasswordSchema, signupSchema } from "@/lib/validation";

type AuthMode = "login" | "signup" | "forgot";

const schemas = {
  login: authSchema,
  signup: signupSchema,
  forgot: forgotPasswordSchema
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const schema = schemas[mode];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });

  const title = mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Login";
  const supabaseActive = isSupabaseEnabled();

  const description =
    mode === "signup"
      ? supabaseActive
        ? "Email verification is handled by Supabase Auth."
        : "Creating account in Local Simulated Mode."
      : mode === "forgot"
        ? supabaseActive
          ? "A reset link will be sent through Supabase Auth."
          : "Simulating password reset request locally."
        : supabaseActive
          ? "Use email login or Google through Supabase Auth."
          : "Logging in using Local Simulated Mode.";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {!supabaseActive && (
            <span className="mt-1 block text-xs font-semibold text-amber-600">
              ⚠️ Supabase keys unconfigured. Running in Mock Mode.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded bg-green-500/10 p-3 text-sm text-green-600 font-medium">
            {successMessage}
          </div>
        )}
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (data) => {
            setError(null);
            setSuccessMessage(null);
            try {
              if (mode === "signup") {
                const res = await signUp(data.email, (data as any).name || "", (data as any).password);
                if (res.error) {
                  setError(res.error);
                } else {
                  setSuccessMessage(
                    supabaseActive
                      ? "Account created! Please check your email for a verification link."
                      : "Account created successfully! Redirecting..."
                  );
                  setTimeout(() => router.push(supabaseActive ? "/auth/verify" : "/dashboard"), 1500);
                }
              } else if (mode === "login") {
                const res = await signIn(data.email, (data as any).password);
                if (res.error) {
                  setError(res.error);
                } else {
                  setSuccessMessage("Logged in successfully! Redirecting...");
                  setTimeout(() => {
                    router.push("/dashboard");
                    router.refresh();
                  }, 1000);
                }
              } else if (mode === "forgot") {
                const res = await forgotPassword(data.email);
                if (res.error) {
                  setError(res.error);
                } else {
                  setSuccessMessage(
                    supabaseActive
                      ? "Password reset link sent to your email!"
                      : "Password reset link request simulated successfully!"
                  );
                }
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Authentication failed");
            }
          })}
        >
          {mode === "signup" && (
            <label className="block space-y-2 text-sm font-medium">
              <span>Name</span>
              <Input {...register("name" as never)} autoComplete="name" />
              {"name" in errors && <span className="text-xs text-destructive">{errors.name?.message}</span>}
            </label>
          )}
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <Input type="email" {...register("email" as never)} autoComplete="email" />
            {"email" in errors && <span className="text-xs text-destructive">{errors.email?.message}</span>}
          </label>
          {mode !== "forgot" && (
            <label className="block space-y-2 text-sm font-medium">
              <span>Password</span>
              <Input type="password" {...register("password" as never)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              {"password" in errors && <span className="text-xs text-destructive">{errors.password?.message}</span>}
            </label>
          )}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait" : title}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:underline">Login</Link>
          <Link href="/auth/signup" className="hover:underline">Signup</Link>
          <Link href="/auth/forgot-password" className="hover:underline">Forgot</Link>
        </div>
      </CardContent>
    </Card>
  );
}
