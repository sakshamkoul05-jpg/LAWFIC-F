"use client";

import { useEffect, useState } from "react";
import { usePreferencesValue } from "@/components/account/usePreferences";

/**
 * The greeting beside the profile — HOM PA INS 5 in the client's blueprint,
 * where it reads "Very Good Morning" over the customer's name.
 *
 * TIME OF DAY IS DECIDED AFTER MOUNT, NOT DURING RENDER
 *
 * The server has no idea what hour it is where the reader is sitting. Reading
 * the clock while rendering means the server picks one greeting and the browser
 * picks another, and React replaces the text — a hydration mismatch that
 * appears as a flicker for most people and as a console error for whoever
 * eventually has to debug it. So the greeting is empty until mounted and
 * resolves once, in the reader's own timezone.
 *
 * It is hidden below the large breakpoint. The header is already dense, and a
 * greeting is the first thing that should give up its space — it is warmth,
 * not navigation.
 *
 * The account privacy setting can turn it off entirely: a name at the top of
 * every page is the one thing on this site that a person standing behind you
 * can read from across a room.
 */
function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Very good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default function HeaderGreeting({ name }: { name: string | null }) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const { privacy } = usePreferencesValue();

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  if (!name || !greeting || !privacy.showName) return null;

  return (
    <span className="mr-1 hidden min-w-0 flex-col items-end leading-tight lg:flex">
      <span className="type-label text-subtle">{greeting}</span>
      <span className="max-w-[14ch] truncate text-[13px] font-medium text-foreground">
        {name}
      </span>
    </span>
  );
}
