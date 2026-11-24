# Native compatibility patches

## getenv 1.0.0

`getenv@1.0.0.patch` is required for compatibility with the current Expo / Metro toolchain. Remove the patch and its `patchedDependencies` entry together when upstream no longer needs it.

## uniwind 1.13.0

`uniwind@1.13.0.patch` makes native `Text` and `TextInput` default to the bundled Outfit font. React Native needs one `fontFamily` per weight, so the patch adds `src/components/native/outfit.ts` (maps `fontWeight` from `font-medium`, `font-semibold`, `font-bold` or inline styles to `Outfit-Regular`, `Outfit-Medium`, `Outfit-SemiBold` or `Outfit-Bold`, and leaves styles with another `fontFamily` alone). A nested `Text` that sets neither `fontWeight` nor `fontFamily` is left untouched (via a React context set by the patched `Text`), so it inherits its parent's Outfit face as in stock React Native; only root `Text` defaults to Outfit-Regular and applies it in `Text.tsx` and `TextInput.tsx`. Web uses `font-family: Outfit` from `src/global.css` instead. Re-apply the same change with `bun patch uniwind` when upgrading Uniwind, then remove this section if Uniwind gains a native default-font option.

Known edge: the nested-`Text` context also reaches a root `Text` placed inside an inline `View` that sits inside another `Text`; without a weight it falls back to the system font there. `uniwind` is pinned to `1.13.0` and excluded in `renovate.json`; `src/utils/tests/uniwind-patch.test.ts` fails if the patch is not applied.
