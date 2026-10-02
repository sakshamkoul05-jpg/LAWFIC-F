import { NextResponse } from "next/server";
import { ANDROID_RELEASE } from "@/lib/app-release";

/**
 * /download/android — the one link printed on posters, QR codes and the
 * header. It forwards to the current APK, so the address customers are given
 * never changes when a new build ships. Before the first build exists it
 * goes back to the download page, which says so.
 */
export function GET(request: Request) {
  const target = ANDROID_RELEASE.ready ? ANDROID_RELEASE.url : new URL("/download", request.url).toString();
  return NextResponse.redirect(target, 302);
}
