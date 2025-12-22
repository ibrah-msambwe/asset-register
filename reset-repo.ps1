# Reset Repository Script
# This will delete all git history and start fresh

Write-Host "⚠️  WARNING: This will delete all git history!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nRemoving .git folder..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

Write-Host "Initializing new git repository..." -ForegroundColor Cyan
git init

Write-Host "Adding all files..." -ForegroundColor Cyan
git add .

Write-Host "Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit - Clean repository without build files"

Write-Host "Setting branch to main..." -ForegroundColor Cyan
git branch -M main

Write-Host "Adding remote origin..." -ForegroundColor Cyan
git remote add origin https://github.com/ibrah-msambwe/asset-register.git

Write-Host "`n✅ Ready to push!" -ForegroundColor Green
Write-Host "Run this command to push:" -ForegroundColor Yellow
Write-Host "git push -u origin main --force" -ForegroundColor White

