"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authSchema, forgotPasswordSchema, signupSchema } from "@/lib/validation";

type AuthMode = "login" | "signup" | "forgot";

const schemas = {
  login: authSchema,
  signup: signupSchema,
  forgot: forgotPasswordSchema
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const schema = schemas[mode];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  });

  const title = mode === "signup" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Login";
  const description =
    mode === "signup"
      ? "Email verification is handled by Supabase Auth when keys are configured."
      : mode === "forgot"
        ? "A reset link is sent through Supabase Auth."
        : "Use email login or Google through Supabase Auth.";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async () => {
            await new Promise((resolve) => setTimeout(resolve, 250));
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
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/signup">Signup</Link>
          <Link href="/auth/forgot-password">Forgot</Link>
        </div>
      </CardContent>
    </Card>
  );
}
