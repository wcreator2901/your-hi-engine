# GitHub Upload Guide

Complete step-by-step instructions to upload your Pulse Wallet project to GitHub.

## ⚠️ IMPORTANT: Security Checklist

Before uploading to GitHub, ensure:

- ✅ `.gitignore` is properly configured (already done)
- ✅ No `.env` files will be committed
- ✅ API keys are in environment variables, not hardcoded
- ✅ Sensitive configuration files are excluded
- ✅ **Review the API key in `Developmentteam/crypto_dev_team/.env`** - This file is excluded by .gitignore

### Files Excluded by .gitignore
The following sensitive files will NOT be uploaded:
- `.env` and all `.env.*` files
- `Developmentteam/**/.env` (CrewAI configuration)
- `node_modules/`
- `dist/` (build outputs)

## 📋 Prerequisites

1. **GitHub Account** - Create one at https://github.com if you don't have one
2. **Git Installed** - Check if installed:
   ```bash
   git --version
   ```
   If not installed, download from: https://git-scm.com/downloads

## 🚀 Step-by-Step Upload Process

### Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Fill in the repository details:
   - **Repository name**: `pulse-wallet` (or your preferred name)
   - **Description**: "Modern multi-language crypto wallet with React, TypeScript, and Supabase"
   - **Visibility**: Choose **Private** (recommended) or Public
   - **Do NOT** initialize with README, .gitignore, or license (we already have these)
3. Click **"Create repository"**
4. **Keep this page open** - you'll need the commands shown

### Step 2: Initialize Local Git Repository

Open PowerShell in your project directory and run:

```powershell
# Navigate to your project
cd C:\Users\User\Desktop\Cursor\your-hi-engine

# Initialize git (if not already initialized)
git init

# Check git status to see what will be committed
git status
```

### Step 3: Review Files to be Committed

Before committing, review the list of files:

```powershell
# See all files that will be committed
git status
```

**Important**: Verify that `.env` files are NOT listed! They should appear under "untracked files" or not at all.

### Step 4: Stage All Files

```powershell
# Add all files to staging
git add .

# Verify what's staged
git status
```

### Step 5: Create Your First Commit

```powershell
# Create a commit with a descriptive message
git commit -m "Initial commit: Multi-language crypto wallet with English and Croatian support"
```

### Step 6: Add GitHub Remote

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

```powershell
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify the remote was added
git remote -v
```

**Example**:
```powershell
git remote add origin https://github.com/johndoe/pulse-wallet.git
```

### Step 7: Rename Main Branch (if needed)

```powershell
# Rename branch to 'main' (GitHub's default)
git branch -M main
```

### Step 8: Push to GitHub

```powershell
# Push your code to GitHub
git push -u origin main
```

**Note**: You may be prompted to log in to GitHub:
- Enter your GitHub username
- For password, use a **Personal Access Token** (not your account password)
  - Generate one at: https://github.com/settings/tokens
  - Select scopes: `repo` (full control)
  - Copy the token and paste it as your password

### Step 9: Verify Upload

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files uploaded
4. Verify that `.env` files are NOT visible

## 🔒 Setting Up Environment Variables on GitHub (for CI/CD)

If you plan to use GitHub Actions or deploy from GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Any other sensitive environment variables

## 📦 One-Command Upload Script

For convenience, here's a PowerShell script to commit and push in one go:

```powershell
# Create a file: upload.ps1
@"
# Quick commit and push script
param([string]$message = "Update project")

git add .
git commit -m "$message"
git push
"@ | Out-File -FilePath upload.ps1 -Encoding UTF8
```

**Usage**:
```powershell
# Run the script with a custom message
./upload.ps1 "Add new feature"

# Or use default message
./upload.ps1
```

## 🔄 Future Updates

After the initial upload, to push new changes:

```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your commit message here"

# Push to GitHub
git push
```

## 🌿 Working with Branches

Create a new branch for features:

```powershell
# Create and switch to new branch
git checkout -b feature/new-language

# Make your changes, then commit
git add .
git commit -m "Add German language support"

# Push the branch
git push -u origin feature/new-language
```

Then create a Pull Request on GitHub to merge into main.

## ❌ Troubleshooting

### Error: "fatal: not a git repository"
**Solution**: Run `git init` first

### Error: "remote origin already exists"
**Solution**:
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### Error: "failed to push some refs"
**Solution**: Pull first, then push
```powershell
git pull origin main --rebase
git push
```

### Error: "Permission denied (publickey)"
**Solution**: Use HTTPS URL instead of SSH, or set up SSH keys:
- https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### `.env` file was accidentally committed
**Solution**: Remove it from history
```powershell
# Remove from tracking
git rm --cached .env

# Commit the removal
git commit -m "Remove .env file"

# Force push (WARNING: rewrites history)
git push --force
```

Then rotate all your API keys immediately!

## 📝 Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Clear Messages**: Describe what changed and why
3. **Review Before Committing**: Always check `git status` first
4. **Never Commit Secrets**: Double-check before pushing
5. **Use Branches**: Create feature branches for new work
6. **Pull Before Push**: Avoid conflicts by staying up-to-date

## 🎯 Quick Reference

```bash
# Essential commands
git status              # Check what's changed
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push                # Push to GitHub
git pull                # Pull latest changes
git log                 # View commit history
git diff                # See what changed

# Branch operations
git branch              # List branches
git checkout -b name    # Create and switch branch
git merge branch-name   # Merge branch into current
git branch -d name      # Delete branch
```

## 🆘 Need Help?

- GitHub Docs: https://docs.github.com
- Git Documentation: https://git-scm.com/doc
- GitHub Support: https://support.github.com

---

**🎉 Once uploaded, your repository URL will be:**
`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

Share this link with collaborators or keep it private!
