# Windows Code Signing Setup for Maintainers

This guide explains how to set up self-signed code signing for Windows builds in the CI/CD pipeline.

## Overview

Official Windows builds from GitHub Releases are signed with a self-signed certificate to reduce SmartScreen warnings. This certificate is stored as GitHub Secrets and used by the GitHub Actions workflow during release builds.

## Prerequisites

- OpenSSL installed (available by default on Linux/macOS)
- Access to the GitHub repository's Settings → Secrets and variables → Actions

## Step 1: Generate Self-Signed Certificate

### On Linux

```bash
# Generate private key and certificate
openssl req -x509 -newkey rsa:2048 \
  -keyout private_key.pem \
  -out certificate.crt \
  -days 1825 \
  -nodes \
  -subj "/CN=AyAis/O=AyAis/C=FR" \
  -addext "extendedKeyUsage=codeSigning" \
  -addext "keyUsage=digitalSignature"

# Create PFX file (choose a strong password)
openssl pkcs12 -export \
  -out certificate.pfx \
  -inkey private_key.pem \
  -in certificate.crt \
  -passout pass:YOUR_PASSWORD_HERE

# Clean up temporary files
rm private_key.pem certificate.crt
```

### On macOS

```bash
# Same as Linux - macOS also comes with OpenSSL
openssl req -x509 -newkey rsa:2048 \
  -keyout private_key.pem \
  -out certificate.crt \
  -days 1825 \
  -nodes \
  -subj "/CN=AyAis Development/O=AyAis/C=FR"

# Create PFX file
openssl pkcs12 -export \
  -out certificate.pfx \
  -inkey private_key.pem \
  -in certificate.crt \
  -passout pass:YOUR_PASSWORD_HERE

# Clean up
rm private_key.pem certificate.crt
```

**Note**: The certificate is valid for 5 years (1825 days). Adjust `-days` if needed.

## Step 2: Convert PFX to Base64

You need to convert the PFX file to base64 so it can be stored as a GitHub Secret.

### On Linux/macOS

```bash
base64 -w 0 certificate.pfx
```

This outputs a single line of base64-encoded text. Copy this entire output.

### Alternative (if `-w 0` not available)

```bash
base64 certificate.pfx | tr -d '\n'
```

## Step 3: Add GitHub Secrets

Go to your GitHub repository:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

### Secret 1: WIN_CERTIFICATE_PFX

- **Name**: `WIN_CERTIFICATE_PFX`
- **Value**: Paste the base64 output from Step 2

### Secret 2: WIN_CERT_PASSWORD

- **Name**: `WIN_CERT_PASSWORD`
- **Value**: The password you chose in Step 1

## Step 4: Verify the Setup

The GitHub Actions workflow (`.github/workflows/windows.yml`) is already configured to:

1. Decode the base64 certificate back to a PFX file
2. Use the password to access it
3. Sign the Windows installer during builds

To verify:

1. Push a new tag (e.g., `git tag v0.1.2 && git push origin v0.1.2`)
2. Check the Actions tab to see the Windows build workflow
3. Download the artifact from the release
4. Right-click the `.exe` → Properties → Digital Signatures
5. You should see a valid signature from "AyAis Development"

## Security Notes

- **Never commit** the PFX file or password to the repository
- **Store the PFX file securely** in case you need to regenerate the base64
- **Use a strong password** for the certificate
- **Keep a backup** of the PFX file in a secure location (e.g., password manager, encrypted storage)

## Troubleshooting

### Build fails with "invalid password"

- Verify `WIN_CERT_PASSWORD` matches exactly
- Check for extra spaces or newlines in the secret value

### Build fails with "certificate not found"

- Verify `WIN_CERTIFICATE_PFX` is complete base64 (no truncation)
- Check that the workflow is running on Windows runner

### Certificate expired

- Regenerate the certificate following Step 1
- Update the GitHub Secrets
- Tag a new release to use the new certificate

## Replacing the Certificate

If you need to replace the certificate (e.g., it expired or was compromised):

1. Generate a new certificate following Step 1
2. Convert to base64 following Step 2
3. Update the GitHub Secrets following Step 3
4. Tag a new release to use the new certificate

## Related Documentation

- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Windows Code Signing Best Practices](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
