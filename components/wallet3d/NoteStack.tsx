"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getDenomination,
  noteTexture,
  DENOMINATIONS,
  NOTE_ASPECT,
  type Denomination,
  type NoteStyleId,
} from "@/lib/wallet3d/banknote";

/**
 * The notes in the wallet, and the flight they take when money is added.
 *
 * Shared by both wallet models so the money behaves identically whichever one
 * is rendering. It was duplicated before, which is how the two drifted.
 *
 * THE STACK IS EVEN
 *
 * Every note sits the same distance above and behind the one before it — no
 * per-note rotation, no sideways scatter. The earlier version fanned them with
 * a different angle and offset each, which is what a hand of cards does, not
 * what a stack of notes in a pocket does: paper that has been counted and put
 * away sits square. The regular step is also what makes the quantity readable
 * — five even edges say "five notes", five splayed ones say "a mess".
 *
 * THE FLIGHT
 *
 * On a credit the notes come in from off-frame and settle into that stack, one
 * after another. Three details do the work:
 *
 *   - they launch from OUTSIDE the camera frustum, so no fade-in is needed.
 *     Fading notes would mean transparent materials, and transparent quads
 *     stacked front-to-back sort badly against each other;
 *   - each note is delayed a little more than the last, so the eye reads them
 *     as counted out rather than as one object splitting;
 *   - the easing decelerates hard into the stack. Money landing should look
 *     like it has weight and then stop, not glide.
 *
 * The animation is driven by a TOKEN rather than a boolean: any change to
 * `arriving` replays the flight. A boolean cannot express "again" — topping up
 * twice in a row would set true, true and the second credit would land in
 * silence.
 */

/**
 * Vertical step between notes, in centimetres.
 *
 * Big enough to count. At 0.13 the six notes overlapped so closely that the
 * stack read as one sheet with a smudge under it — even spacing is only worth
 * having if the eye can resolve the steps.
 */
const STEP_Y = 0.19;
/** Depth step, so the near edge of each note catches its own light. */
const STEP_Z = 0.035;
/** Seconds between one note leaving and the next. */
const STAGGER = 0.11;
/** Seconds a single note is in the air. */
const FLIGHT = 0.72;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export type NoteStackProps = {
  notes: Denomination[];
  /** 0 shut, 1 open — the whole stack lifts out of the pocket. */
  open: number;
  /** Change this to replay the fly-in. */
  arriving?: number;
  /** How the notes are printed. */
  style?: NoteStyleId;
  /** Note width in centimetres; height follows the artwork's proportion. */
  width: number;
  position: [number, number, number];
};

export default function NoteStack({
  notes,
  open,
  arriving = 0,
  style = "classic",
  width,
  position,
}: NoteStackProps) {
  const height = width / NOTE_ASPECT;
  const shown = notes.slice(0, 6);

  const refs = useRef<(THREE.Group | null)[]>([]);
  const startedAt = useRef<number | null>(null);
  const lastToken = useRef(arriving);
  /* The wallet plays the flight once when it first appears, so the money is
     counted into it rather than already sitting there. It is the same motion a
     credit uses, which means a customer has seen it before the first time it
     matters. */
  const intro = useRef(true);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 26, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      /* A sheet held in a pocket bows; a flat quad reads as a printed card. */
      pos.setZ(i, Math.cos((x / (width / 2)) * 1.25) * 0.1);
    }
    g.computeVertexNormals();
    return g;
  }, [width, height]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;

    if (intro.current) {
      intro.current = false;
      startedAt.current = now;
    }
    if (arriving !== lastToken.current) {
      lastToken.current = arriving;
      startedAt.current = now;
    }
    const t0 = startedAt.current;

    for (let i = 0; i < refs.current.length; i++) {
      const g = refs.current[i];
      if (!g) continue;

      const restY = i * STEP_Y + open * 0.5;
      const restZ = i * STEP_Z;

      /* No flight in progress: sit in the stack and do nothing per frame. */
      if (t0 === null) {
        g.position.set(0, restY, restZ);
        g.rotation.set(0, 0, 0);
        continue;
      }

      const p = clamp01((now - t0 - i * STAGGER) / FLIGHT);
      /* Cubic ease-out: fast away from the launch, almost stopped on arrival. */
      const e = 1 - Math.pow(1 - p, 3);

      /* Off to the upper right and well outside the frame. */
      const fromX = 17 + i * 1.6;
      const fromY = 8 + i * 0.9;
      const fromZ = 6;

      g.position.set(
        fromX + (0 - fromX) * e,
        fromY + (restY - fromY) * e,
        fromZ + (restZ - fromZ) * e,
      );
      /* A note tumbles as it falls and is square by the time it lands. */
      g.rotation.set(0.55 * (1 - e), -0.4 * (1 - e), -0.85 * (1 - e));
    }

    /* Retire the flight once the last note has landed, so the common case
       costs three assignments a frame instead of a pile of easing. */
    if (t0 !== null && now - t0 > STAGGER * refs.current.length + FLIGHT) {
      startedAt.current = null;
    }
  });

  return (
    <group position={position}>
      {shown.map((value, i) => {
        const d = getDenomination(value) ?? DENOMINATIONS[0];
        return (
          <group
            key={`${value}-${i}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={[0, i * STEP_Y + open * 0.5, i * STEP_Z]}
          >
            <mesh geometry={geo} castShadow>
              <meshStandardMaterial
                map={noteTexture(d, "front", style)}
                roughness={0.88}
                metalness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
