# Maintaining cronsmith

Notes for the maintainer. Not user-facing.

## Verifying

```sh
npm run verify   # typecheck (src + tests) + tests + build
```

Runs automatically before every `npm version` bump and before `npm publish`.

## Releasing

One command, end-to-end:

```sh
npm version patch   # 0.1.0 → 0.1.1   bug fix
npm version minor   # 0.1.0 → 0.2.0   new feature (or breaking, pre-1.0)
npm version major   # 0.1.0 → 1.0.0   breaking change
```

What that runs, in order:

1. `preversion` → `npm run verify`. Bump aborts if anything fails.
2. Version bump in `package.json` + `package-lock.json`.
3. Git commit and tag (e.g. `v0.1.1`).
4. `postversion` → `git push --follow-tags`. Pushes the commit and tag.

Once a publish workflow is wired up (`.github/workflows/publish.yml`), the pushed tag triggers it and ships to npm. Until then, follow the tag push with:

```sh
npm publish
```

## Pre-1.0 versioning

Per semver, `0.x` releases can break things in a `minor` bump. Use `minor` for any incompatible API change while cronsmith stays on `0.x`. Reserve `major` (going to `1.0.0`) for the moment you commit to a stable API.

## Notes

- `prepublishOnly` also runs `verify`, so a broken build can never publish.
- `npm version` won't proceed if the working tree is dirty. Commit or stash first.
- The CI matrix in `.github/workflows/ci.yml` runs against Node 22, 24, and 26. If you change `engines.node`, update the matrix accordingly.
- Build is `tsup` (dual ESM + CJS). Type declarations are emitted by tsup's internal `dts` step, which runs `tsc` under the hood — so a broken type error in `src/` will fail the build even though `typecheck:test` is the explicit gate.
- Before the first publish, verify the npm name is still free: `npm view cronsmith`.
