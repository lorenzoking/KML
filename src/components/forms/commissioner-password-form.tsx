"use client";

import { useState, useTransition } from "react";
import { signInWithCommissionerPassword } from "@/actions/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/submit-button";

export function CommissionerPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await signInWithCommissionerPassword(formData);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="commissioner-email">Email</Label>
        <Input
          id="commissioner-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="commissioner-password">Password</Label>
        <Input
          id="commissioner-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <SubmitButton className="w-full" disabled={pending} pendingText="Signing in...">
        Sign in as commissioner
      </SubmitButton>
    </form>
  );
}
