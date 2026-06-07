---
name: workspace-organizer
description: Enforces and automates project organization standards for the LakshyaSSB codebase. Use this to audit the root directory, standardize naming conventions, and ensure files are in their idiomatic locations.
---

# Workspace Organizer

This skill maintains the structural integrity of the LakshyaSSB project. Use it to audit the workspace and apply cleanup actions based on the established architecture.

## Organization Standards

### 1. Root Directory Management
Keep the root directory clean. Only configuration files (`.json`, `.ts`, `.js`, `.mjs`, `.bat`, `.env`) that are truly project-wide should remain.
- **Tests**: Move all `test-*.ts` and `test_*.ts` files to `/tests`.
- **Scripts**: Move utility scripts like `generate_plates.js` or `check_users.ts` to `/scripts`.
- **Middleware**: `proxy.ts` should be renamed to `middleware.ts` if intended as Next.js middleware, or moved to `/lib` if it's a helper.

### 2. Evaluator Pattern
All AI/logic evaluators must reside in `lib/evaluators/`.
- **Action**: Move `lib/watEvaluator.ts` to `lib/evaluators/watEvaluator.ts`.

### 3. Data Integrity
Avoid redundant data formats.
- **Action**: Prefer `.ts` over `.json` for data that is imported by components (e.g., `data/searchItems.ts` is the source of truth, `data/searchItems.json` should be removed).
- **Cleanup**: Remove build artifacts like `tsc.log` and ensure they are in `.gitignore`.

### 4. Naming Conventions
Standardize on **kebab-case** for all new files and directories.
- **Incorrect**: `test_cron.ts`, `watEvaluator.ts`
- **Correct**: `test-cron.ts`, `wat-evaluator.ts`

## Common Workflows

### Audit Workspace
Ask: "Run a workspace audit to find misplaced files or naming violations."

### Perform Cleanup
Ask: "Execute the workspace cleanup plan to move root scripts and standardize evaluators."

### New File Placement
Ask: "Where should I put a new utility for processing images?"
(Expected answer: `/scripts` or `/lib` depending on usage).
