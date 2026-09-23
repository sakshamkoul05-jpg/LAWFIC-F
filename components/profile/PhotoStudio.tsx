"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageIcon, Loader2, RotateCcw, Trash2, X, ZoomIn } from "lucide-react";
import { ACCEPT, PHOTO_SPEC, type PhotoKind } from "@/lib/profile-photos";

/**
 * Taking or choosing a profile picture, cropping it, and saving it.
 *
 * THREE WAYS IN, BECAUSE PHONES AND LAPTOPS ARE NOT THE SAME MACHINE
 *
 *   1. Gallery — a plain file input. Works everywhere, and on a phone it opens
 *      the photo library.
 *   2. Camera, live — getUserMedia into a <video>, with a shutter button. This
 *      is what a laptop gets, and what a phone gets when it allows it: you see
 *      yourself before you commit, which is the difference between one photo
 *      and four attempts.
 *   3. Camera, hand-off — <input capture="user">, which opens the phone's own
 *      camera app. The fallback for any browser that will not grant a live
 *      stream, and on iOS in particular it is often the one that works.
 *
 * The third is not dead code kept "just in case": getUserMedia needs HTTPS and
 * a permission the customer may simply refuse, and a photo button that does
 * nothing after a refusal is a broken feature. If the live stream fails for any
 * reason, the hand-off runs instead.
 *
 * WHY THE CROP IS NOT OPTIONAL
 *
 * A phone camera produces a 4:3 or 3:4 photograph. The avatar is a circle and
 * the cover is 3:1. Something has to decide what gets cut, and if the customer
 * does not, the code does — which is how people end up as a profile picture of
 * their own forehead. Dragging to reframe takes two seconds and removes the
 * whole class of complaint.
 *
 * It also does the privacy work. The canvas re-encode that produces the crop
 * writes fresh pixels and carries no metadata block, so the EXIF on the
 * original — including the GPS coordinates a phone writes into every photo —
 * never leaves the device.
 */

type Stage =
  | { name: "idle" }
  | { name: "camera" }
  | { name: "crop"; bitmap: ImageBitmap }
  | { name: "busy"; what: "uploading" | "removing" };

export function PhotoStudio({
  kind,
  initialUrl,
  onChanged,
}: {
  kind: PhotoKind;
  initialUrl: string | null;
  /** Called with the new signed URL, or null once removed. */
  onChanged?: (url: string | null) => void;
}) {
  const spec = PHOTO_SPEC[kind];
  const ratio = spec.w / spec.h;

  const [url, setUrl] = useState<string | null>(initialUrl);
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);

  const busy = stage.name === "busy";

  /* ── loading a file the customer picked ─────────────────────────────── */

  const openFile = useCallback(async (file: File) => {
    setError(null);
    try {
      /* createImageBitmap decodes off the main thread and, importantly, tells
         us immediately whether the browser can read this format at all. */
      const bitmap = await createImageBitmap(file);
      setStage({ name: "crop", bitmap });
    } catch {
      setError(
        "Your browser cannot open that picture. iPhone photos are often HEIC — " +
          "try the camera button instead, or save the photo as a JPEG first.",
      );
    }
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    /* Cleared so choosing the SAME file twice still fires a change event. */
    e.target.value = "";
    if (file) void openFile(file);
  };

  /* ── saving ─────────────────────────────────────────────────────────── */

  const upload = useCallback(
    async (blob: Blob) => {
      setStage({ name: "busy", what: "uploading" });
      setError(null);

      const body = new FormData();
      body.append("kind", kind);
      body.append("file", blob, `${kind}.webp`);

      try {
        const res = await fetch("/api/profile/photo", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as {
          url?: string | null;
          message?: string;
          error?: string;
        };

        if (!res.ok) {
          setError(json.message ?? messageFor(res.status));
          setStage({ name: "idle" });
          return;
        }

        setUrl(json.url ?? null);
        onChanged?.(json.url ?? null);
        setStage({ name: "idle" });
      } catch {
        setError("That did not reach us. Check your connection and try again.");
        setStage({ name: "idle" });
      }
    },
    [kind, onChanged],
  );

  const remove = useCallback(async () => {
    setStage({ name: "busy", what: "removing" });
    setError(null);
    try {
      const res = await fetch(`/api/profile/photo?kind=${kind}`, { method: "DELETE" });
      if (!res.ok) {
        setError(messageFor(res.status));
      } else {
        setUrl(null);
        onChanged?.(null);
      }
    } catch {
      setError("That did not reach us. Check your connection and try again.");
    }
    setStage({ name: "idle" });
  }, [kind, onChanged]);

  /* ── the camera ─────────────────────────────────────────────────────── */

  const openCamera = useCallback(() => {
    setError(null);
    /* `typeof ... === "function"`, not a truthiness test: the DOM types declare
       mediaDevices as always present, so TypeScript flags the shorter version
       as a condition that cannot be false. At runtime it very much can be —
       any page served over plain http has no mediaDevices at all. */
    const live =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function";

    if (live) {
      setStage({ name: "camera" });
    } else {
      /* No live stream available — hand off to the phone's camera app. */
      captureRef.current?.click();
    }
  }, []);

  return (
    <div className="w-full">
      {/* ── what is there now ── */}
      <div
        className={
          kind === "avatar"
            ? "relative mx-auto h-28 w-28 overflow-hidden rounded-full border border-border bg-surface-2"
            : "relative h-32 w-full overflow-hidden rounded-2xl border border-border bg-surface-2 sm:h-40"
        }
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed, short-lived
          // storage URL. The optimizer would cache it past its own expiry.
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={kind === "avatar" ? 26 : 22} className="text-subtle" aria-hidden />
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Loader2 size={20} className="animate-spin text-foreground" aria-hidden />
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[11.5px] text-subtle">
        {url ? spec.label : `No ${spec.label.toLowerCase()} yet`}
      </p>

      {/* ── the three ways in ── */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Action onClick={openCamera} disabled={busy} icon={<Camera size={15} />}>
          Take a photo
        </Action>
        <Action
          onClick={() => galleryRef.current?.click()}
          disabled={busy}
          icon={<ImageIcon size={15} />}
        >
          Choose from gallery
        </Action>
        {url && (
          <Action onClick={remove} disabled={busy} icon={<Trash2 size={15} />} danger>
            Remove
          </Action>
        )}
      </div>

      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        className="sr-only"
        aria-label={`Choose a ${spec.label.toLowerCase()} from your files`}
      />
      <input
        ref={captureRef}
        type="file"
        accept={ACCEPT}
        capture="user"
        onChange={onPick}
        className="sr-only"
        aria-label={`Take a ${spec.label.toLowerCase()} with your camera`}
      />

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-destructive-light px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {stage.name === "camera" && (
        <CameraSheet
          onClose={() => setStage({ name: "idle" })}
          onFallback={() => {
            setStage({ name: "idle" });
            captureRef.current?.click();
          }}
          onShot={(bitmap) => setStage({ name: "crop", bitmap })}
        />
      )}

      {stage.name === "crop" && (
        <CropSheet
          bitmap={stage.bitmap}
          ratio={ratio}
          round={kind === "avatar"}
          out={spec}
          onCancel={() => {
            stage.bitmap.close?.();
            setStage({ name: "idle" });
          }}
          onDone={(blob) => {
            stage.bitmap.close?.();
            void upload(blob);
          }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE CAMERA
   ══════════════════════════════════════════════════════════════════════════ */

function CameraSheet({
  onClose,
  onShot,
  onFallback,
}: {
  onClose: () => void;
  onShot: (bitmap: ImageBitmap) => void;
  onFallback: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });

        /* The component can unmount while the permission prompt is open. Without
           this the stream starts after the teardown has run and the camera light
           stays on with nothing showing it. */
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        const name = (e as DOMException)?.name;
        setDenied(
          name === "NotAllowedError"
            ? "Your browser blocked the camera. Allow it in the address bar, or use your phone's camera instead."
            : "No camera is available here. Use your phone's camera or choose a picture from your files.",
        );
      }
    })();

    return () => {
      cancelled = true;
      /* Stopping every track is what turns the camera light off. Dropping the
         reference alone does not: the stream outlives the component. */
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const shoot = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Mirrored, because the preview is mirrored. A photo that flips at the
       moment of capture is disconcerting, and any text in shot comes out
       backwards either way — matching the preview is the lesser surprise. */
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.92));
    if (!blob) return;
    onShot(await createImageBitmap(blob));
  }, [onShot]);

  return (
    <Sheet title="Take a photo" onClose={onClose}>
      {denied ? (
        <div className="px-1 py-6 text-center">
          <p className="text-[13.5px] leading-relaxed text-foreground">{denied}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Action onClick={onFallback} icon={<Camera size={15} />}>
              Use my phone camera
            </Action>
            <Action onClick={onClose}>Cancel</Action>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-square w-full scale-x-[-1] object-cover"
            />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center">
                <Loader2 size={22} className="animate-spin text-white/70" aria-hidden />
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={shoot}
              disabled={!ready}
              aria-label="Take the photo"
              className="grid h-16 w-16 place-items-center rounded-full border-4 border-border-3 bg-foreground transition-transform active:scale-95 disabled:opacity-40"
            >
              <Camera size={22} className="text-background" aria-hidden />
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE CROP
   ══════════════════════════════════════════════════════════════════════════ */

const FRAME_W = 300;

function CropSheet({
  bitmap,
  ratio,
  round,
  out,
  onCancel,
  onDone,
}: {
  bitmap: ImageBitmap;
  ratio: number;
  round: boolean;
  out: { w: number; h: number };
  onCancel: () => void;
  onDone: (blob: Blob) => void;
}) {
  const frameH = Math.round(FRAME_W / ratio);

  /* The smallest zoom that still covers the frame. Anything below it would show
     background through a corner, so it is the floor rather than 1. */
  const minScale = Math.max(FRAME_W / bitmap.width, frameH / bitmap.height);

  const [scale, setScale] = useState(minScale);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  /* Keeps the image covering the frame however it is dragged or zoomed. Without
     it a pan can leave a transparent wedge that the customer only discovers
     after saving. */
  const clamp = useCallback(
    (p: { x: number; y: number }, s: number) => {
      const limitX = Math.max(0, (bitmap.width * s - FRAME_W) / 2);
      const limitY = Math.max(0, (bitmap.height * s - frameH) / 2);
      return {
        x: Math.min(limitX, Math.max(-limitX, p.x)),
        y: Math.min(limitY, Math.max(-limitY, p.y)),
      };
    },
    [bitmap.width, bitmap.height, frameH],
  );

  /* Paint. Re-runs on every pan and zoom; the whole frame is 300px wide so this
     is cheap enough to do synchronously. */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FRAME_W * dpr;
    canvas.height = frameH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, FRAME_W, frameH);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, FRAME_W / 2 - w / 2 + pos.x, frameH / 2 - h / 2 + pos.y, w, h);
  }, [bitmap, scale, pos, frameH]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPos(clamp({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }, scale));
  };

  const onUp = () => {
    drag.current = null;
  };

  const zoomTo = (next: number) => {
    const s = Math.min(minScale * 4, Math.max(minScale, next));
    setScale(s);
    setPos((p) => clamp(p, s));
  };

  const confirm = async () => {
    setWorking(true);

    /* Rendered at the stored size, not the preview size: the frame is 300px
       wide and the avatar is stored at 512, so cropping the preview would save
       a picture blurrier than the one that was chosen. */
    const canvas = document.createElement("canvas");
    canvas.width = out.w;
    canvas.height = out.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setWorking(false);
      return;
    }

    const k = out.w / FRAME_W;
    const w = bitmap.width * scale * k;
    const h = bitmap.height * scale * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, out.w / 2 - w / 2 + pos.x * k, out.h / 2 - h / 2 + pos.y * k, w, h);

    /* WebP at 0.86 — a 512px face lands around 30 KB, and the difference from
       0.95 is invisible at the size this is ever drawn. Falls back to JPEG on
       any browser that cannot encode WebP; the server accepts both. */
    const blob =
      (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86))) ??
      (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88)));

    if (blob) onDone(blob);
    else setWorking(false);
  };

  return (
    <Sheet title="Frame your picture" onClose={onCancel}>
      <div className="flex flex-col items-center">
        <div
          className="relative touch-none select-none overflow-hidden border border-border bg-surface-2"
          style={{
            width: FRAME_W,
            height: frameH,
            borderRadius: round ? "50%" : 16,
            cursor: "grab",
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <canvas
            ref={canvasRef}
            style={{ width: FRAME_W, height: frameH, display: "block" }}
            aria-label="Drag to reframe your picture"
          />
        </div>

        <p className="mt-3 text-[11.5px] text-subtle">Drag to move. Use the slider to zoom.</p>

        <div className="mt-3 flex w-full max-w-[300px] items-center gap-3">
          <ZoomIn size={15} className="shrink-0 text-subtle" aria-hidden />
          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={minScale / 60}
            value={scale}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="Zoom"
            className="h-9 w-full accent-primary"
          />
          <button
            type="button"
            onClick={() => {
              setScale(minScale);
              setPos({ x: 0, y: 0 });
            }}
            aria-label="Reset the framing"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={15} aria-hidden />
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          <Action onClick={confirm} disabled={working} icon={working ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} primary>
            {working ? "Saving" : "Use this picture"}
          </Action>
          <Action onClick={onCancel} disabled={working}>
            Cancel
          </Action>
        </div>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHELL
   ══════════════════════════════════════════════════════════════════════════ */

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  /* Escape closes it, and while it is open the page behind does not scroll —
     on a phone, a modal over a scrolling page means the background moves under
     your finger while you are trying to drag the crop. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-t-3xl border border-border bg-surface px-5 pb-8 pt-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Action({
  children,
  onClick,
  disabled,
  icon,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition-colors disabled:opacity-50",
        primary
          ? "bg-primary text-background hover:bg-primary-hover"
          : danger
            ? "border border-border text-destructive hover:bg-destructive-light"
            : "border border-border text-foreground hover:bg-surface-2",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function messageFor(status: number): string {
  if (status === 401) return "Your session has expired. Sign in and try again.";
  if (status === 413) return "That picture is too large.";
  if (status === 415) return "That file is not a picture we can read.";
  if (status === 503) return "Photo storage is not switched on for this site yet.";
  return "That did not save. Try again in a moment.";
}
