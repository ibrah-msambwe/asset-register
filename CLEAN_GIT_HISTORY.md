# Clean Git History - Remove .next Files Completely

## ⚠️ WARNING
This will rewrite git history and requires force-pushing. Only do this if:
- No one else is working on the repository, OR
- You've coordinated with your team
- You're okay with others needing to re-clone the repository

## Option 1: Use git-filter-repo (Recommended)

```bash
# Install git-filter-repo first
pip install git-filter-repo

# Remove .next folder from entire git history
git filter-repo --path .next --invert-paths --force

# Force push to remote (this will rewrite history)
git push origin --force --all
```

## Option 2: Use BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Remove .next folder from history
java -jar bfg.jar --delete-folders .next

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

## Current Status (After our fix)

✅ `.next` folder is removed from git tracking
✅ `.gitignore` is updated to prevent future commits
✅ Future commits won't include `.next` files
✅ Repository size will grow slower going forward

**Note**: The old files are still in git history, but they won't affect new clones or deployments since they're in `.gitignore`.

## Recommendation

**If you're the only developer or just starting**: You can safely clean the history.

**If you have collaborators**: Leave it as-is. The important thing is that future commits are clean, which we've already fixed.

