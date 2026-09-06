# public/wallet

## lawfic-wallet.glb

The client's own wallet model, and what actually renders on the wallet page.

It is a **derived** file. Do not hand-edit it — rebuild it:

```
assets-src/build-wallet-glb.sh
```

The source is `assets-src/wallet-raw.glb`, exactly as the client exported it:
a trimesh file, one mesh, 445k triangles, 6.9MB, **POSITION only**. No normals,
no texture coordinates, no material. Two of those absences are blocking rather
than cosmetic:

- with no normals the mesh cannot be lit. Every face returns the same value and
  it renders as a flat silhouette;
- with no texture coordinates nothing can be mapped onto it, and the entire
  finish system — leather grain, nylon weave, brushed metal — is UV-sampled.
  Without an unwrap the wallet can only ever be one flat colour.

The build script decimates to 27k triangles, unwraps with xatlas, centres the
result and quantizes it to 374KB. Normals are computed at load time rather than
baked, so the component chooses the smoothing.

`components/wallet3d/WalletGLB.tsx` measures the bounding box rather than
assuming a pose or a unit, so a re-export at a different scale or handedness
still frames correctly.

### Tiling

The unwrap packs the whole object into one 0–1 atlas: ~191cm² of surface into
unit UV space, which works out at roughly 16.7cm across one full tile. The
repeat values in `WalletGLB` are derived from that number so pebble grain lands
at about 1.6mm and a woven thread at about 0.7mm. If the model is re-exported
or the simplification ratio changes, re-measure rather than adjusting by eye —
the browser's zoom level is not a unit of measurement.

## What is NOT here, and is not needed

Earlier versions of this page expected a rendered frame sequence and a set of
two-state product photographs. Both are gone: the wallet is real 3D now, and
those tiers were removed along with the components that consumed them.
