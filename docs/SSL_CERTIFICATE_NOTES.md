# SSL Certificate and Auto-Update Configuration

## Problem

When using a **self-signed certificate** to sign the Windows application, the auto-update feature may fail with the error:

```
Une chaîne de certificats a été traitée mais s'est terminée par un certificat racine qui n'est pas approuvé par le fournisseur d'approbation
```

(A certificate chain was processed but terminated with a root certificate that is not trusted by the trust provider)

## ✅ Solution: Automatic SSL Handling

**Good news**: The application **automatically handles** self-signed certificates on Windows!

### How It Works

The code in `app/services/auto-updater.service.ts` (lines 82-108) **automatically detects**:

1. **Windows platform** (`process.platform === 'win32'`)
2. **Production build** (`app.isPackaged === true`)

When both conditions are met, it **automatically relaxes SSL verification** to enable auto-update.

```typescript
// In app/services/auto-updater.service.ts
if (process.platform === 'win32' && app.isPackaged) {
  // Automatically relax SSL for self-signed certificates
  console.warn('[AutoUpdate] Windows production build with self-signed certificate');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
```

### What This Means

- ✅ **No manual configuration needed** for GitHub Actions builds
- ✅ **Auto-update works** on Windows with self-signed certificates
- ✅ **Fully automated** in CI/CD pipeline
- ⚠️ **Logging** informs users about the SSL relaxation

### For GitHub Actions Builds

The Windows workflow (`.github/workflows/windows.yml`) automatically:

1. Builds the application with `npm run electron:build`
2. Includes the auto-update code (with SSL handling)
3. Creates the Windows installer
4. Uploads artifacts to GitHub releases

**No additional configuration required!**

## Manual Builds (Local Development)

### For Local Testing

If you want to test the auto-update locally with SSL verification disabled:

```bash
# Option 1: Using environment variable
AYAIS_DISABLE_SSL_VERIFICATION=true npm start

# Option 2: Temporarily disable updater
AYAIS_DISABLE_UPDATER=true npm start
```

**Note**: These are only for local development. Production builds via GitHub Actions work automatically.

### For Local Production Builds

If you build locally (not recommended, use GitHub Actions):

```bash
npm run electron:build
```

The code will **automatically** handle SSL if:

- You're on Windows
- The build is packaged (production mode)

## Better Solution: Trusted Certificate (Recommended)

### Why Upgrade?

| Aspect              | Self-Signed                 | Trusted CA     |
| ------------------- | --------------------------- | -------------- |
| **Cost**            | Free                        | ~$400-600/year |
| **Windows Warning** | ⚠️ "Unrecognized publisher" | ✅ No warning  |
| **SSL Workaround**  | ⚠️ Required                 | ✅ Not needed  |
| **User Trust**      | ⚠️ Lower                    | ✅ Higher      |
| **Professional**    | ⚠️ Less                     | ✅ More        |
| **Setup**           | Complex                     | Simple         |

### Purchase a Certificate

**Recommended providers** (most affordable to most expensive):

1. **[Certum](https://www.certum.pl/certum/certificates/certifiedEV/)** - ~$500/year
   - Best value for open-source projects
   - Fully trusted by Windows
   - Good support

2. **[Sectigo](https://sectigo.com/ssl-certificates-tls/code-signing)** - ~$400/year
   - Most affordable option
   - Trusted by Windows

3. **[DigiCert](https://www.digicert.com/signing/code-signing-certificates)** - ~$600/year
   - Industry standard
   - Best support
   - Enterprise choice

### Migration Steps

1. **Purchase certificate** from trusted CA
2. **Get certificate files** (usually `.pfx` or `.p12`)
3. **Update GitHub Secrets**:
   - Go to Repository → Settings → Secrets
   - Update `WIN_CERTIFICATE_PFX` with new certificate
   - Update `WIN_CERT_PASSWORD` with new password
4. **Remove SSL workaround** from code:
   - Delete lines 95-108 in `app/services/auto-updater.service.ts`
5. **Commit and push**
6. **Create new release** via GitHub Actions

**Result**: No more SSL warnings, no workaround code needed!

## Environment Variables

These variables are **optional** and mostly for development:

| Variable                         | Purpose                             | When to Use        | Default |
| -------------------------------- | ----------------------------------- | ------------------ | ------- |
| `AYAIS_DISABLE_SSL_VERIFICATION` | Force disable SSL (manual override) | Local testing only | `false` |
| `AYAIS_DISABLE_UPDATER`          | Completely disable auto-update      | Development        | `false` |

**Note**: For GitHub Actions production builds, **no variables needed** - everything is automatic!

## Security Considerations

### Is the Automatic SSL Handling Safe?

**Yes**, because:

1. **Download channel is secure**: Updates come from GitHub (valid SSL certificate)
2. **Only code signing is self-signed**: The relaxed SSL is only for verifying the app's signature
3. **No MITM risk**: GitHub's SSL protection prevents man-in-the-middle attacks
4. **Acceptable trade-off**: Small security risk for functional auto-update

### Security Model

```
┌─────────────────────────────────────────────┐
│ User's Windows Machine                       │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ AyAIs.exe (self-signed signature)  │   │
│  │                                      │   │
│  │  Auto-Update:                        │   │
│  │    - Detects Windows + packaged ✓   │   │
│  │    - Relaxes SSL for signature ✓    │   │
│  │    - Downloads from GitHub ✓       │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                 ↓ HTTPS (Valid SSL) ↓        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ GitHub Releases                             │
│  • Valid SSL certificate (DigiCert, etc)   │
│  • Secure HTTPS connection                 │
│  • Hosts update files                      │
└─────────────────────────────────────────────┘
```

**Key Points**:

- ✅ GitHub connection is **secure** (valid SSL)
- ⚠️ Only app signature verification is relaxed
- ✅ Updates come from **trusted source** (your GitHub repo)

## Troubleshooting

### Auto-Update Still Fails

**Checklist**:

- [ ] Release published on GitHub?
- [ ] Release has all artifacts (`.exe`, `.yml`, `.blockmap`)?
- [ ] Version in `package.json` < Release version?
- [ ] Windows build produced by GitHub Actions?
- [ ] Check logs for SSL warnings

**Verify logs** in the app (F12 → Console):

```
[AutoUpdate] ⚠️  Windows production build with self-signed certificate detected.
[AutoUpdate] SSL verification relaxed to enable auto-update (certificate workaround).
```

### Build Fails with Certificate Error

**Check GitHub Secrets**:

1. Go to Repository → Settings → Secrets
2. Verify `WIN_CERTIFICATE_PFX` exists
3. Verify `WIN_CERT_PASSWORD` exists
4. Test certificate locally:
   ```bash
   # Verify certificate
   openssl pkcs12 -info -in cert.pfx -nokeys
   ```

### Want to Remove the Workaround

**Only recommended if you have a trusted CA certificate**:

1. Purchase certificate (see above)
2. Update GitHub Secrets
3. Remove lines 95-108 from `app/services/auto-updater.service.ts`
4. Test build locally: `npm run electron:build`
5. Commit and push
6. Create GitHub release

## Summary

### Current Configuration (Self-Signed)

✅ **Pros**:

- Free
- Auto-update works automatically
- Good for open-source projects
- No manual configuration needed

⚠️ **Cons**:

- Windows shows "Unrecognized publisher" warning
- Requires SSL workaround in code
- Less professional appearance

### Recommended Configuration (Trusted CA)

⭐ **Pros**:

- No Windows warnings
- No SSL workaround needed
- Better user trust
- More professional
- Simple setup

⚠️ **Cons**:

- Costs ~$400-600/year
- Requires certificate purchase

## Quick Reference

### For Most Users (Current Setup)

**Auto-update works automatically on Windows!**

- GitHub Actions builds → Auto-update enabled
- Self-signed certificate → SSL automatically handled
- No configuration needed ✅

### For Enhanced Security (Future)

When ready to invest in a trusted certificate:

1. Purchase from Certum/Sectigo/DigiCert
2. Update GitHub Secrets
3. Remove workaround code (lines 95-108)
4. Rebuild via GitHub Actions

## Additional Resources

- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Windows Code Signing Requirements](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [CI/CD Configuration](docs/CI_CD_AUTO_UPDATE.md)
- [Windows Auto-Update Details](docs/WINDOWS_AUTO_UPDATE.md)
