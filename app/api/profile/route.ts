import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile, EMPTY_PROFILE, type UserProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read and write a user's profile.
 *
 * Same security shape as /api/wallet/prefs: anon key + RLS. A user can only
 * touch their own row, and the resume file is already scoped by its storage
 * path (<user_id>/...) enforced at upload time.
 */
async function getProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string
): Promise<UserProfile> {
  const { data } = await supabase
    .from("user_profiles")
    .select("full_name, phone, city, qualification, exams_preparing, jobs_looking, resume_path")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return EMPTY_PROFILE;

  return {
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    city: data.city ?? "",
    qualification: data.qualification ?? "",
    examsPreparing: data.exams_preparing ?? [],
    jobsLooking: data.jobs_looking ?? [],
    resumePath: data.resume_path ?? "",
  };
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const profile = await getProfile(supabase, auth.user.id);
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = normalizeProfile(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: auth.user.id,
      full_name: result.profile.fullName,
      phone: result.profile.phone,
      city: result.profile.city,
      qualification: result.profile.qualification,
      exams_preparing: result.profile.examsPreparing,
      jobs_looking: result.profile.jobsLooking,
      resume_path: result.profile.resumePath,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[profile] upsert failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  // Mark onboarding complete so the auth callback routes here only once.
  // Non-fatal if it fails — the profile row is already saved.
  await supabase.auth.updateUser({
    data: {
      full_name: result.profile.fullName,
      onboarded: true,
    },
  });

  return NextResponse.json(result.profile);
}