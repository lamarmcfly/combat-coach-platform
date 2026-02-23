# Branch Protection Checklist (Main)

Use this checklist in GitHub Settings to keep the Phase 3 consent/safety flow enforced.

## Rule Target

- Branch name pattern: `main`

## Pull Request Protection

- Require a pull request before merging
- Require approvals (recommended: at least 1)
- Dismiss stale pull request approvals when new commits are pushed
- Require conversation resolution before merging

## Required Status Checks

- Require status checks to pass before merging
- Require branches to be up to date before merging
- Add this required check:
  - `Verify Consent & Safety Flow`

This check is produced by workflow: `.github/workflows/phase3-consent-safety.yml`.

## Additional Recommended Restrictions

- Require linear history
- Do not allow force pushes
- Do not allow deletions
- Restrict who can push directly to `main`

## Maintenance Note

If the job name in `.github/workflows/phase3-consent-safety.yml` changes, update the required check name in branch protection to match exactly.
