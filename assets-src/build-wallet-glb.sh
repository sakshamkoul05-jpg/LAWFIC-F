#!/usr/bin/env bash
# Rebuilds public/wallet/lawfic-wallet.glb from the client's raw export.
#
# The raw file is a trimesh export: ONE mesh, 445k triangles, POSITION only —
# no normals, no texture coordinates, no material. At 6.9MB it is a modelling
# asset, not a web asset, and without UVs no texture of ours could be put on
# it at all. This pipeline turns it into something a phone can download and
# our material system can address.
#
#   weld      merge coincident vertices, so simplification has real topology
#             to work with rather than 445k islands
#   simplify  6% of the vertices. A card holder is a slab with rounded edges;
#             the detail that survives is the silhouette and the pocket wave,
#             which is all the detail there is
#   unwrap    generate TEXCOORD_0 (xatlas). This is the step that matters:
#             the procedural leather, nylon and metal maps are UV-sampled, and
#             an unwrapped mesh cannot receive them
#   center    origin at the middle of the object, so the scene can position it
#             without hard-coded offsets
#   quantize  14-bit positions, 12-bit texcoords. At this object's size that is
#             ~0.1mm of precision, and it halves the file
#
# Normals are deliberately NOT baked: they are computed at load time, which
# lets the component pick the smoothing angle rather than inheriting whatever
# the exporter chose.
set -euo pipefail
cd "$(dirname "$0")/.."
GT="npx --yes @gltf-transform/cli@4.5.0"
T="$(mktemp -d)"
$GT weld     assets-src/wallet-raw.glb "$T/a.glb"
$GT simplify "$T/a.glb" "$T/b.glb" --ratio 0.06 --error 0.004
$GT unwrap   "$T/b.glb" "$T/c.glb"
$GT center   "$T/c.glb" "$T/d.glb"
$GT prune    "$T/d.glb" "$T/e.glb"
$GT quantize "$T/e.glb" public/wallet/lawfic-wallet.glb \
  --quantize-position 14 --quantize-texcoord 12
$GT inspect public/wallet/lawfic-wallet.glb
