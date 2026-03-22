# Build and Deployment Guide

## Quick Start

### ⭐ Recommended: GitHub Actions CI/CD (Production)

**This is the standard method** for building and deploying AyAIs.

```bash
# 1. Update version in package.json
npm version minor  # or major, or patch

# 2. Commit changes
git add .
git commit -m "chore: release v0.x.x"

# 3. Create and push tag
git tag v0.x.x
git push origin main --tags

# 4. GitHub Actions automatically builds for Windows, Mac, and Linux
# 5. Release is created automatically with all artifacts
```

**See**: [CI_CD_AUTO_UPDATE.md](docs/CI_CD_AUTO_UPDATE.md) for complete details.

### Manual Build (Local Development Only)

**Use only for** testing or development. Not recommended for production.

```bash
# Standard build
npm run electron:build
```

**Note**: For Windows production, use GitHub Actions. It handles certificates automatically.

## GitHub Actions Workflows

### Workflow Files

- **`.github/workflows/windows.yml`** - Windows builds (with code signing)
- **`.github/workflows/macos.yml`** - macOS builds
- **`.github/workflows/linux.yml`** - Linux builds
- **`.github/workflows/release.yml`** - Orchestrates release process

### Build Process

```
Tag Push (v0.x.x) → release.yml
                          ↓
         +------------+-------------+-------------+
         ↓            ↓             ↓             ↓
    macos.yml    linux.yml    windows.yml    (artifacts)
                                                    ↓
                                              release.yml
                                                    ↓
                                          GitHub Release
```

### What Gets Built

Each platform workflow:

1. Checks out code
2. Sets up Node.js
3. Installs dependencies
4. Runs tests (unit + e2e)
5. Sets up code signing certificate (Windows only)
6. Builds application
7. Uploads artifacts for release

## Code Signing

### Windows (Self-Signed Certificate)

**Current Setup**:

- Certificate stored in GitHub Secrets (`WIN_CERTIFICATE_PFX`)
- Self-signed certificate (free)
- Auto-update works with automatic SSL handling

**Auto-Update SSL Handling**:
The code **automatically detects** Windows + production and relaxes SSL verification:

```typescript
// app/services/auto-updater.service.ts:95-108
if (process.platform === 'win32' && app.isPackaged) {
  // Automatically handles self-signed certificates
  console.warn('[AutoUpdate] SSL verification relaxed for auto-update');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
```

**✅ No configuration needed** - it's automatic!

### Upgrade to Trusted Certificate (Recommended)

**Cost**: ~$400-600/year

**Benefits**:

- ✅ No "Unrecognized publisher" warning
- ✅ No SSL workaround needed
- ✅ Better user trust
- ✅ More professional

**Providers**:

- [Certum](https://www.certum.pl/) - ~$500/year (best for OSS)
- [Sectigo](https://sectigo.com/) - ~$400/year
- [DigiCert](https://www.digicert.com/) - ~$600/year

**Process**:

1. Purchase certificate
2. Update GitHub Secrets (`WIN_CERTIFICATE_PFX`, `WIN_CERT_PASSWORD`)
3. Remove SSL workaround from code (lines 95-108)
4. Rebuild via GitHub Actions

### For Development (Local Testing)

Generate a self-signed certificate for local testing:

```bash
# Generate private key
openssl genrsa -out key.pem 4096

# Generate certificate
openssl req -new -key key.pem -out cert.pem -days 365 \
  -subj "/CN=AyAIs Dev"

# Convert to PFX (Windows)
openssl pkcs12 -export -out cert.pfx -inkey key.pem -in cert.pem
```

**Never commit** certificate files!

## Environment Configuration

### Required for GitHub Actions

**Repository Settings** → **Secrets and variables** → **Actions**:

| Secret Name           | Description                     | Required For   |
| --------------------- | ------------------------------- | -------------- |
| `WIN_CERTIFICATE_PFX` | Base64-encoded certificate file | Windows builds |
| `WIN_CERT_PASSWORD`   | Certificate password            | Windows builds |

**See**: [CI_CD_AUTO_UPDATE.md](docs/CI_CD_AUTO_UPDATE.md) for setup instructions.

## Release Process

### Standard Release Flow

```bash
# 1. Update version
npm version minor  # or major, or patch

# 2. Update CHANGELOG.md
vim CHANGELOG.md

# 3. Commit and tag
git add .
git commit -m "chore: release v0.x.x"
git tag v0.x.x
git push origin main
git push origin v0.x.x

# 4. GitHub Actions does the rest:
#    - Builds for Windows, Mac, Linux
#    - Runs all tests
#    - Creates GitHub release
#    - Uploads artifacts
```

### Verification

After release is created:

1. **Download installers** from GitHub release
2. **Test Windows installer** on clean Windows machine
3. **Test auto-update** from previous version
4. **Verify signature**:
   ```bash
   signtool verify /pa /v "AyAis-setup-x.x.x.exe"
   ```

## Troubleshooting

### GitHub Actions Build Fails

**Checklist**:

- [ ] GitHub Secrets are configured (certificate)
- [ ] Certificate password is correct
- [ ] All tests pass locally
- [ ] Version in `package.json` is correct

**Common Issues**:

1. **Certificate Error**:

   ```
   ERROR: WIN_CERT_PASSWORD secret is empty
   ```

   **Fix**: Add secrets to GitHub repository settings

2. **Test Failures**:
   ```
   Tests failed in CI but pass locally
   ```
   **Fix**: Ensure all dependencies are installed (`npm ci`)

### Auto-Update Doesn't Work

**Windows**:

- [ ] Release published on GitHub?
- [ ] Release has artifacts (`.exe`, `.yml`, `.blockmap`)?
- [ ] Check app console (F12) for SSL warnings
- [ ] Verify logs show:
  ```
  [AutoUpdate] Windows production build with self-signed certificate
  [AutoUpdate] SSL verification relaxed
  ```

**Mac/Linux**:

- [ ] Release published on GitHub?
- [ ] Certificate valid and not expired?
- [ ] Update channel matches (stable/beta)?

### Local Build Issues

**Windows**:

```bash
# Ensure certificate is in build/ directory
ls build/certificate.pfx

# Build
npm run electron:build

# Check output
ls release/*.exe
```

## Best Practices

### Before Release

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Test locally**:
   ```bash
   npm run test
   npm run test:e2e
   ```
4. **Verify configuration**:
   - GitHub Secrets set
   - Certificate valid
   - electron-builder.json correct

### During Release

1. **Create annotated tag**:
   ```bash
   git tag -a v0.x.x -m "Release v0.x.x"
   ```
2. **Push tag**:
   ```bash
   git push origin v0.x.x
   ```
3. **Monitor workflows** on GitHub
4. **Verify all platforms** build successfully

### After Release

1. **Test installers** on clean machines
2. **Test auto-update** from previous version
3. **Monitor issues** on GitHub
4. **Update documentation** if needed

## CI/CD vs Manual Builds

| Aspect                   | GitHub Actions (Recommended)     | Manual (Local)          |
| ------------------------ | -------------------------------- | ----------------------- |
| **Windows Builds**       | ✅ Automatic (with SSL handling) | ⚠️ Manual setup         |
| **Certificate Handling** | ✅ Automatic                     | ❌ Manual configuration |
| **Code Signing**         | ✅ Integrated                    | ❌ Manual setup         |
| **Testing**              | ✅ Automated                     | ❌ Manual               |
| **Release Creation**     | ✅ Automatic                     | ❌ Manual               |
| **Reproducibility**      | ✅ Consistent                    | ⚠️ Depends on env       |
| **Use For**              | Production                       | Development/Testing     |

## Security

### Certificate Storage

**✅ DO**:

- Store in GitHub Secrets (encrypted)
- Keep encrypted backup
- Use strong passwords
- Rotate password periodically

**❌ DON'T**:

- Commit certificate files
- Store passwords in code
- Share certificates publicly
- Use same password everywhere

### Build Security

GitHub Actions provides:

- ✅ Encrypted secrets
- ✅ Isolated build environments
- ✅ Workflow execution logs
- ✅ Artifact integrity checks

## Performance

### Build Times

Typical build times on GitHub Actions:

| Platform | Build Time | Test Time | Total  |
| -------- | ---------- | --------- | ------ |
| Windows  | ~5 min     | ~2 min    | ~7 min |
| macOS    | ~4 min     | ~2 min    | ~6 min |
| Linux    | ~3 min     | ~2 min    | ~5 min |

### Optimization

Already optimized:

- ✅ Cached Node modules
- ✅ Parallel builds
- ✅ Minimal dependencies
- ✅ Efficient tests

## Additional Resources

- [CI_CD_AUTO_UPDATE.md](docs/CI_CD_AUTO_UPDATE.md) - Complete CI/CD guide
- [SSL_CERTIFICATE_NOTES.md](docs/SSL_CERTIFICATE_NOTES.md) - Certificate management
- [WINDOWS_AUTO_UPDATE.md](docs/WINDOWS_AUTO_UPDATE.md) - Windows-specific details
- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
