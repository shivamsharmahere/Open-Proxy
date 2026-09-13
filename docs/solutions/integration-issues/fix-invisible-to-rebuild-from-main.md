---
title: A finished fix on a task branch is invisible to a rebuild-from-main deploy
date: 2026-09-13
category: solutions/integration-issues
module: release/deploy pipeline (Docker image built from the main checkout)
problem_type: integration_issue
component: development_workflow
severity: medium
symptoms:
  - rebuilt container still reproduces a bug whose fix is committed and reviewed
  - image build timestamp is newer than the fix commit but was built from a checkout missing the fix
  - user reports the fixed behavior broken hours after a successful rebuild
root_cause: missing_workflow_step
resolution_type: workflow_improvement
related_components: [infrastructure, documentation]
tags: [deploy, docker, task-branch, version-bump, stale-build, release]
---

# A finished fix on a task branch is invisible to a rebuild-from-main deploy

## Problem

A completed, fully tested, independently reviewed bug fix lived only on its task branch while the deployment path (Docker image build) compiles from the `main` checkout. The operator rebuilt and redeployed the container, and the "new" deployment still reproduced the fixed bug.

## Symptoms

- The freshly rebuilt container still exhibits a behavior that a committed, reviewed fix eliminates.
- `docker images` shows an image build timestamp *newer* than the fix commit timestamp — so a build-date comparison alone suggests the fix should be in — yet the fixed behavior is absent, because the build sourced its context from `main`, which did not contain the fix branch.
- The user reports the supposedly-fixed behavior as broken hours after a successful rebuild, and the proxy's own access log proves the old code path is running (e.g. `404 ... none other` lines for the exact case the fix removes).

## What Didn't Work

- **Fix completion did not deploy anything.** The per-model retrieve fix (v0.6.7's payload) was committed on `fix/per-model-retrieve` at 19:31 IST with a green suite (235 lib + 126 e2e + 8 openapi) and an independent review PASS. None of that changes the running container.
- **The operator's rebuild was real but sourced from the wrong state.** The image was rebuilt at 19:38 IST — seven minutes after the fix commit — and the container recreated at 19:41 IST, all from the `main` checkout. Because the fix had not been merged to `main`, the rebuild faithfully packaged stale code. Diagnosis was only possible by checking *which checkout the build ran in*, not just timestamps: `git log --oneline` on the main checkout vs the branch that held the fix.

## Solution

The release sequence that made the fix actually reach the running container (v0.6.7):

1. **Merge to main first** — the deploy artifact's only source: `git merge --ff-only fix/per-model-retrieve` on the `main` checkout.
2. **Bump the version in the same series as the merge** — `Cargo.toml` `version = "0.6.7"` (Cargo.toml:3), so the running binary's version becomes comparable to the repo version.
3. **Regenerate the versioned artifacts a committed test enforces** — `UPDATE_OPENAPI=1 cargo test --test openapi` regenerates `openapi.json` (tests/openapi.rs:9 documents the command, :38 is its UPDATE_OPENAPI trigger), and the test asserts the committed spec equals the freshly generated one (:49-53) with `info.version` equal to `CARGO_PKG_VERSION` (:64).
4. **Record the release** — a `## [0.6.7] - 2026-09-13` section in CHANGELOG.md (CHANGELOG.md:81) carrying the fix note.
5. **Rebuild from the main checkout and tag the version**: `docker build -t localhost/open-proxy:0.6.7 -t localhost/open-proxy:latest .` run in the main checkout.
6. **Recreate the container with identical run flags** so config and history carry over: `docker stop open-proxy && docker rm open-proxy && docker run -d --name open-proxy -v open-proxy-data:/data -p 127.0.0.1:8000:8000 localhost/open-proxy:0.6.7`.
7. **Verify the fixed behavior live, not just the suite** — e.g. `curl /v1/models/z-ai/glm-5.3-free` returns the second group's catalog entry (pre-fix: the wrong upstream's 404), and the access log shows real model ids on `/v1/models` lines.

## Why This Works

The container's image is compiled from whatever state the build context holds, and the build context is the `main` checkout. A fix on any other branch is invisible to it regardless of how finished, tested, or reviewed that fix is. The version bump converts "is the fix in the running build?" from an archaeology question into a one-glance invariant: the running binary reports its version, the repo states its version, and a mismatch (or a match on a pre-fix number) is detectable before a user hits the stale behavior. The changelog section tied to the merge gives the bump a durable, dated record. Live post-deploy verification closes the loop the test suite cannot: the suite proves the code, only the live probe proves the *deployment*.

## Prevention

- **Never call a fix "deployed" until the running artifact is traced to a commit that contains the fix.** Concretely: confirm the merge landed on the branch the build context uses, then compare the container's image build time (`docker inspect --format '{{.Created}}'`) with the merge commit's timestamp — and, better, the image's version against the repo's.
- **Make the version bump part of the merge series**, as its own commit, so "merged" and "versioned" cannot drift apart. In this repo the openapi test enforces that the bump propagates to the committed spec: it asserts the committed file equals the freshly generated one (tests/openapi.rs:49-53) and that `info.version` equals `CARGO_PKG_VERSION` (tests/openapi.rs:64), with `UPDATE_OPENAPI=1` (tests/openapi.rs:38) as the regeneration trigger.
- **Verify the fixed behavior live after every deploy** — one request exercising the fixed path beats a green suite for the question "did the fix ship?".
- **Remember the branch topology**: while a task branch exists, `main` is not fixed. The incident is recorded in the repo's chronology (knowledge/log.md:29-31) as part of the v0.6.7 release entry.
