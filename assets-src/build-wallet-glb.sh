#!/usr/bin/env bash
# Turns a raw wallet export into a web asset.
#
#   build-wallet-glb.sh <source.glb> <public/wallet/name.glb> [ratio]
#
# The client's exports are trimesh files: hundreds of thousands of triangles,
# several megabytes, POSITION only — no normals, no texture coordinates, no
# material. Two of those absences are blocking rather than cosmetic. Without
# normals the mesh cannot be lit at all; without texture coordinates no texture
# of ours can be put on it, and the entire finish system is UV-sampled.
#
#   weld      merge coincident vertices, so simplification has real topology to
#             work with rather than a pile of loose triangles
#   simplify  keep the given fraction of vertices. What survives is silhouette,
#             stitch grooves and the pocket edges, which is the detail there is
#   unwrap    generate TEXCOORD_0 with xatlas. The step that matters: an
#             unwrapped mesh can only ever be one flat colour
#   center    origin at the middle, so the scene positions it without offsets
#   quantize  14-bit positions, 12-bit texcoords — ~0.1mm at this size, half
#             the bytes
#
# Normals are deliberately NOT baked; they are computed at load time so the
# component picks the smoothing rather than inheriting the exporter's.
set -euo pipefail
SRC="$1"
OUT="$2"
RATIO="${3:-0.08}"
cd "$(dirname "$0")/.."
GT="npx --yes @gltf-transform/cli@4.5.0"
T="$(mktemp -d)"
$GT weld     "$SRC"      "$T/a.glb"
$GT simplify "$T/a.glb"  "$T/b.glb" --ratio "$RATIO" --error 0.004
$GT unwrap   "$T/b.glb"  "$T/c.glb"
$GT center   "$T/c.glb"  "$T/d.glb"
$GT prune    "$T/d.glb"  "$T/e.glb"
$GT quantize "$T/e.glb"  "$OUT" --quantize-position 14 --quantize-texcoord 12
$GT inspect  "$OUT"
