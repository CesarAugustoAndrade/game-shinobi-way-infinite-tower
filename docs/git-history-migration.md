# Git history & LFS migration plan

> **Do not run a history rewrite without team coordination and a full backup.**

## Problem

As of the integration-readiness pass:

| Component | Approx. size | Notes |
|-----------|--------------|--------|
| `.git` total | ~5.5 GB | Dominates clone time and CI checkout |
| Git objects | ~4.6 GB | Pre-LFS binary history still present |
| Git LFS store | ~955 MB | `.gitattributes` tracks media; history before LFS still bloated |

Large PNGs/JPGs were committed before LFS, then later tracked with LFS. Clones still pay for old blobs unless history is rewritten.

## Goals

1. Fresh clone under **~1 GB** (ideally &lt; 500 MB with LFS smudge deferred).
2. Preserve `main` / `develop` tips and tags with a coordinated cutover.
3. Keep LFS for future binary assets.

## Recommended approach (high level)

### 0. Preconditions

- [ ] Full bare mirror backup: `git clone --mirror <url> shinobi-backup.git`
- [ ] Offline copy of LFS objects: `git lfs fetch --all` on a clean machine
- [ ] Freeze merges to `main`/`develop` during cutover window
- [ ] Notify all contributors; old SHAs will be invalid

### 1. Inventory

```bash
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ {print $3, $4}' | sort -rn | head -50
git lfs ls-files
```

Identify largest historical paths (old skill packs, `_stage_gen`, QA dumps, duplicate enemies).

### 2. Rewrite options (pick one)

| Tool | Pros | Cons |
|------|------|------|
| `git filter-repo` + `git lfs migrate` | Precise path/size filters | Rewrites all SHAs |
| BFG Repo-Cleaner | Simple blob size purge | Less flexible than filter-repo |
| Fresh orphan root + import tip trees | Smallest result | Loses granular history |

**Preferred:** `git filter-repo` to drop known dead trees (`_stage_gen/`, historical `old_square_skills/`, root dumps), then `git lfs migrate import --everything --include="*.png,*.jpg,..."` on remaining media.

### 3. Force-push & re-clone

1. Force-push rewritten refs to a **new remote** first (validate CI + LFS).
2. Swap default remote / archive old remote as read-only.
3. All developers: delete local clones; re-clone; reinstall LFS hooks.

### 4. CI

- Prefer `lfs: true` only when jobs need assets; otherwise `GIT_LFS_SKIP_SMUDGE=1` for pure typecheck if assets are not required.
- Cache `node_modules` and LFS objects between runs.

## Out of scope for automatic PR bots

- Force-push to `main`/`develop`
- Deleting remote backups
- Running `filter-repo` without human approval

## Related

- Asset budget: `scripts/check-dist-budget.mjs`
- Runtime purge already done on tip: `public/assets/skills/old_square_skills`, `_qa`, `public/enemies`
