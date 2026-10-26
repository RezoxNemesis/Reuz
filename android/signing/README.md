# Reuz permanent release signing

This repository stores only `reuz-release.p12.enc`, an encrypted copy of the
Android release keystore. The private key is generated **once** by
`scripts/reuz-release-signing.sh` and is never committed in plaintext.

On every push to `main`, the GitHub Actions workflow decrypts the existing
file using the repository's `REUZ_KEYSTORE_PASSWORD` Actions secret, derives an
ASCII PKCS12 password, and signs the APK and AAB with the same certificate.

**Do not change or delete** `REUZ_KEYSTORE_PASSWORD` or
`android/signing/reuz-release.p12.enc` after initialization. That would prevent
future app updates; the build is designed to fail rather than silently rotate.

The previous `REUZ_KEYSTORE_B64` and `REUZ_KEY_ALIAS` secrets are no longer
used. Pull-request self-tests use temporary throwaway keys, not this release key.

A release signed with this certificate cannot directly upgrade an APK signed
with the earlier debug certificate. Existing debug-signed installations need a
reinstall, and an already-published Play app requires Play Console signing
compatibility.
