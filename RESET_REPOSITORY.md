# Reset Repository - Clean Start

## ⚠️ WARNING: This will delete all git history locally

## Step 1: Backup Important Files (Optional but Recommended)
```bash
# Copy your project to a backup location first
# Then proceed with the reset
```

## Step 2: Remove Git History and Start Fresh

### Option A: Complete Reset (Recommended)
```powershell
# Remove git folder
Remove-Item -Recurse -Force .git

# Re-initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Clean repository"

# Add remote (replace with your actual repository URL)
git remote add origin https://github.com/ibrah-msambwe/asset-register.git

# Force push to replace everything on GitHub
git branch -M main
git push -u origin main --force
```

### Option B: Keep Remote, Clean Local History
```powershell
# Remove git folder
Remove-Item -Recurse -Force .git

# Re-initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Clean repository"

# Add remote
git remote add origin https://github.com/ibrah-msambwe/asset-register.git

# Force push
git branch -M main
git push -u origin main --force
```

## Step 3: Verify .gitignore is Correct

Make sure `.gitignore` includes:
```
/.next/
/out/
node_modules/
.env*.local
```

## After Reset

Your repository will be clean with:
- ✅ No large .next files in history
- ✅ Clean git history
- ✅ All current code preserved
- ✅ Ready for deployment

