# How to Merge Friend's Frontend Changes

## Current Situation
- **Your branch**: `prod`
- **Friend's branch**: `origin/frontend` 
- **New feature**: Schedule Availability feature

## Option 1: Merge Frontend Branch into Prod (Recommended)

### Step 1: Save your current work
```bash
# Check what files you've modified
git status

# If you have uncommitted changes you want to keep:
git add .
git commit -m "Add scripts and documentation"
```

### Step 2: Merge friend's changes
```bash
# Make sure you're on prod branch
git checkout prod

# Merge the frontend branch
git merge origin/frontend
```

### Step 3: Resolve conflicts (if any)
If there are conflicts, Git will show you which files:
```bash
# See conflicted files
git status

# For each conflicted file, edit it to resolve conflicts
# Look for <<<<<<< HEAD markers
# Then:
git add <resolved-file>
git commit -m "Merge frontend branch, resolve conflicts"
```

## Option 2: Create a New Branch for Testing

If you want to test the merge first:

```bash
# Create a new branch from prod
git checkout -b test-merge-frontend

# Merge frontend into this test branch
git merge origin/frontend

# Test the changes
# If everything works, merge back to prod:
git checkout prod
git merge test-merge-frontend
```

## Option 3: Cherry-pick Specific Commits

If you only want specific changes:

```bash
# See the commits
git log origin/frontend --oneline

# Cherry-pick a specific commit
git cherry-pick <commit-hash>
```

## What Changed?

Based on the diff, your friend added:
- ✅ **ScheduleManagement.js** - New component (694 lines)
- ✅ **Schedule.js model** - New database model
- ✅ Changes to Dashboard, MenuManagement, RestaurantSettings
- ⚠️ Removed some POS components (OrderConfirmation, PaymentModal, RecentOrders)

## Quick Merge Command

If you want to merge now, run:

```bash
# 1. Commit your current changes first
git add code/server/scripts/*.js code/server/COGNITO_TO_RDS_CONNECTION.md
git commit -m "Add database scripts and documentation"

# 2. Merge friend's changes
git merge origin/frontend

# 3. If conflicts occur, resolve them manually
```

## After Merging

1. **Test the application** - Make sure everything works
2. **Check for conflicts** - Some files might have been modified on both sides
3. **Update dependencies** if needed:
   ```bash
   cd code/client
   npm install
   ```

## Troubleshooting

### If merge fails due to conflicts:
```bash
# See what files have conflicts
git status

# Abort merge if needed
git merge --abort

# Or continue after resolving
git add .
git commit
```

### If you want to see what will change:
```bash
# Preview changes without merging
git diff prod..origin/frontend

# See only file names
git diff prod..origin/frontend --name-only
```

