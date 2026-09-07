# public/wallet

## lawfic-bifold-closed.glb · lawfic-bifold-open.glb

The client's own bifold, shut and open. These are what render on the wallet
page. Both are **derived** files — do not hand-edit them, rebuild them:

```
assets-src/build-wallet-glb.sh assets-src/bifold-closed-raw.glb public/wallet/lawfic-bifold-closed.glb 0.07
assets-src/build-wallet-glb.sh assets-src/bifold-open-raw.glb   public/wallet/lawfic-bifold-open.glb   0.10
```

The sources in `assets-src/` are exactly as the client exported them: trimesh
files of 581k and 311k triangles, 8.8MB and 4.8MB, **POSITION only**. No
normals, no texture coordinates, no material. Two of those absences are
blocking rather than cosmetic:

- with no normals the mesh cannot be lit. Every face returns the same value and
  it renders as a flat silhouette;
- with no texture coordinates nothing can be mapped onto it, and the entire
  finish system — leather grain, pull-up mottling, nylon weave, brushed
  metal — is UV-sampled. Without an unwrap the wallet can only ever be one
  flat colour.

The script decimates, unwraps with xatlas, centres and quantizes: 513KB and
445KB. Normals are computed at load time rather than baked, so the component
chooses the smoothing.

### Two meshes, not one that folds

They have different topology — 21k vertices against 31k — so there is no morph
between them. `WalletBifold` hides the swap instead: the wallet turns edge-on,
the meshes exchange while its silhouette is a line, and it turns back.

### Tiling

Each mesh's atlas has its own density, and they differ: the closed export packs
305cm² of surface into unit UV space, the open one 433cm². The repeat in
`WalletBifold` is derived from those measurements so the hide sits at the same
physical scale in both states — which matters, because the flip shows them one
after the other. If either model is re-exported or the simplification ratio
changes, **re-measure** rather than adjusting by eye; the browser's zoom level
is not a unit of measurement.

## Retired

`lawfic-wallet.glb` was the slim card holder, replaced by the bifold. Its
source is still `assets-src/wallet-raw.glb` and the component is in git
history, should the design ever come back.
