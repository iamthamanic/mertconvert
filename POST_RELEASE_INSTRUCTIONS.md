# Post-Release Instructions for MERT-Convert v2.0.0

## Manual Steps Required

Since some steps require manual interaction with external services, here are the detailed instructions to complete the release process:

## 1. Create GitHub Repository

**⚠️ REQUIRED: You must manually create the GitHub repository**

1. Go to **https://github.com/iamthamanic**
2. Click **"New Repository"**
3. Fill out the form:
   - **Repository name**: `mertconvert`
   - **Description**: `Easy-to-use CLI tool for converting images to WebP and videos to WebM`
   - **Visibility**: Public
   - **❌ DO NOT** initialize with README, .gitignore, or license (we have these files)
4. Click **"Create Repository"**

## 2. Push Code to GitHub

After creating the repository, run these commands:

```bash
cd /Users/halteverbotsocialmacpro/Desktop/arsvivai/MERTCONVERT

# Verify git status
git status

# Push to GitHub for the first time
git push -u origin main

# Create and push release tag
git tag -a v2.0.0 -m "Release version 2.0.0 - Professional CLI tool ready for npm"
git push origin v2.0.0
```

## 3. Create GitHub Release

1. Go to **https://github.com/iamthamanic/mertconvert/releases**
2. Click **"Create a new release"**
3. Fill out the release form:
   - **Tag version**: `v2.0.0`
   - **Release title**: `MERT-Convert v2.0.0 - Professional Release`
   - **Description**: Copy the v2.0.0 section from CHANGELOG.md
4. Click **"Publish release"**

## 4. Publish to npm

**⚠️ REQUIRED: You need an npm account**

If you don't have an npm account:
1. Go to **https://www.npmjs.com/**
2. Sign up for a free account
3. Verify your email address

### Publishing Commands:

```bash
# Login to npm (you'll be prompted for credentials)
npm login

# Verify you're logged in
npm whoami

# Test the package build (optional but recommended)
npm pack
# This creates mertconvert-2.0.0.tgz - you can inspect it

# Publish to npm registry
npm publish

# Verify publication was successful
npm view mertconvert
```

## 5. Verification Steps

After publishing, verify everything works:

```bash
# Test global installation
npm install -g mertconvert@latest

# Test the CLI tool works
mertconvert --help  # (if your CLI has help)
# OR just run it
mertconvert

# Test npx usage (no installation required)
npx mertconvert@latest

# Check the npm package page
# Visit: https://www.npmjs.com/package/mertconvert
```

## 6. Update Repository Settings (Optional)

On GitHub, you might want to:

1. **Add topics/tags**: Go to repository → About section → Settings
   - Add topics like: `cli`, `webp`, `webm`, `converter`, `typescript`, `nodejs`

2. **Set up branch protection** (if planning ongoing development):
   - Go to Settings → Branches
   - Add protection rules for `main` branch

3. **Enable Issues and Discussions** (already enabled by default)

## Success Verification Checklist

✅ **Complete these verifications:**

- [ ] GitHub repository is accessible at https://github.com/iamthamanic/mertconvert
- [ ] Repository shows all files (README.md displays properly)
- [ ] Release v2.0.0 appears in releases section
- [ ] npm package is published at https://www.npmjs.com/package/mertconvert
- [ ] `npm install -g mertconvert` works
- [ ] `npx mertconvert` works without installation
- [ ] Package shows version 2.0.0
- [ ] README badges show correct version
- [ ] All links in README work properly

## Troubleshooting

### If npm publish fails:
```bash
# Check if package name is available
npm view mertconvert

# If name is taken, you might need to scope it
# Update package.json name to "@yourusername/mertconvert"
# Then run: npm publish --access public
```

### If GitHub push fails:
```bash
# Check remote configuration
git remote -v

# Re-add remote if needed
git remote remove origin
git remote add origin https://github.com/iamthamanic/mertconvert.git
git push -u origin main
```

### If tests fail during prepublish:
```bash
# Run tests manually to see detailed errors
npm test

# Check linting
npm run lint

# Fix any issues and commit changes
git add .
git commit -m "Fix: Resolve pre-publish issues"
```

## Final Steps

1. **Monitor the release**: Watch for any issues or user feedback
2. **Share the release**: Announce on relevant platforms if desired
3. **Plan next steps**: Review the "Unreleased" section in CHANGELOG.md for future features

## Contact & Support

- **GitHub Issues**: https://github.com/iamthamanic/mertconvert/issues
- **npm Package**: https://www.npmjs.com/package/mertconvert

---

**🎉 Congratulations on your professional v2.0.0 release!**

Your MERT-Convert CLI tool is now ready for users worldwide to install with:
```bash
npx mertconvert
```