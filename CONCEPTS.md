# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Release and deployment

### Version-bump series
The commit series that pairs a fix merge with the crate version bump and its regenerated, test-enforced artifacts (generated API spec plus the release's changelog section). The bump is what makes "which code is running" a one-glance comparison between the deployed binary's reported version and the repository's stated version, so a stale deploy is detectable before a user hits it.

### Rebuild-from-main deploy
This project's deployment path: the container image is compiled from whatever state the main checkout holds, so a fix on any other branch — however finished, tested, or reviewed — is invisible to it until merged. A rebuild's recency proves nothing about fix content; only tracing the image to a commit that contains the fix does.

### Live post-deploy verification
The closing step of a release: exercising the fixed behavior against the running container (one request through the fixed path plus its access-log line), which answers "did the fix ship?" in a way the green test suite cannot — the suite proves the code, only the live probe proves the deployment.
