/**
 * The LAWFIC Android app, as offered for download on /download.
 *
 * The APK is published as a GitHub Release on the public LAW-M repository
 * and fetched through GitHub's "latest release" link, so shipping a new
 * build means uploading it to a new release — this file only changes when
 * the version, size or checksum shown to the customer changes.
 *
 * `ready` stays false until a real build is uploaded: the page then says the
 * app is on its way instead of offering a link that 404s.
 */
export const ANDROID_RELEASE = {
  ready: false,
  version: "0.1.0",
  /** Shown beside the button, e.g. "64 MB". Empty until a build exists. */
  size: "",
  /** SHA-256 of the APK, so a careful customer can check the file. */
  sha256: "",
  url: "https://github.com/sakshamkoul05-jpg/LAW-M/releases/latest/download/lawfic.apk",
} as const;

/** The web app — iPhone customers until the App Store listing exists. */
export const WEB_APP_URL = "https://law-m.vercel.app";

/** The page the QR codes point at. */
export const DOWNLOAD_PAGE_URL = "https://lawfic.pro/download";
