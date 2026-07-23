---
name: Next build cache
description: Workspace-specific behavior when the dev server and production build share `.next`.
---

When the Next dev workflow is running while a production build reuses the same `.next` directory, builds can fail with internal errors or the dev server can log concurrent cache/compaction writes.

**Why:** Both processes write generated Next artifacts and cache files, so the conflict is environmental rather than a source-code error.

**How to apply:** Stop or restart the dev workflow around a production build, and remove `.next` before retrying a corrupted build. Restart the workflow after the build completes.