"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export function SentryUserContext() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email ?? undefined,
        username: session.user.name ?? undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);

  return null;
}
