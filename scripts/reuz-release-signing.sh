#!/usr/bin/env bash
# First production run creates one release key. All later runs reuse it.
# Only an AES-256-encrypted PKCS12 file is ever committed to GitHub.
set -euo pipefail
umask 077

: "${RUNNER_TEMP:?GitHub runner temporary directory is required}"
self_test=false
if [[ "${1:-}" == "--self-test" ]]; then
  self_test=true
  REUZ_SIGNING_ENCRYPTION_SECRET="$(openssl rand -hex 48)"
  export REUZ_SIGNING_ENCRYPTION_SECRET
  encrypted_file="$RUNNER_TEMP/reuz-release-selftest.p12.enc"
else
  if [[ "${GITHUB_REF:-}" != "refs/heads/main" || "${GITHUB_EVENT_NAME:-}" == "pull_request" ]]; then
    echo '::error::Persistent production signing may only run on main.'
    exit 1
  fi
  encrypted_file="android/signing/reuz-release.p12.enc"
fi

if [[ -z "${REUZ_SIGNING_ENCRYPTION_SECRET:-}" ]]; then
  echo '::error::The existing REUZ_KEYSTORE_PASSWORD GitHub secret is missing; cannot unlock the persistent signing key.'
  exit 1
fi

# Derive an ASCII-only PKCS12 password; the previous Unicode password is
# used only as an OpenSSL encryption secret, never for Java's PKCS12 reader.
REUZ_CI_STORE_PASSWORD="$(printf 'reuz-signing-store-v1:%s' "$REUZ_SIGNING_ENCRYPTION_SECRET" | sha256sum | cut -d' ' -f1)"
export REUZ_CI_STORE_PASSWORD
echo "::add-mask::$REUZ_CI_STORE_PASSWORD"
key_file="$RUNNER_TEMP/reuz-release-signing.p12"
new_key=false

decrypt_key() {
  if ! openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 \
      -in "$encrypted_file" -out "$key_file" \
      -pass env:REUZ_SIGNING_ENCRYPTION_SECRET >/dev/null 2>&1; then
    rm -f "$key_file"
    echo '::error::Cannot decrypt the persistent signing key. Never change or remove the REUZ_KEYSTORE_PASSWORD secret after initialization.'
    exit 1
  fi
}

if [[ -f "$encrypted_file" ]]; then
  decrypt_key
  echo 'Reusing the permanent Reuz signing certificate.'
else
  # If a signing key existed in repository history, never silently rotate.
  if [[ "$self_test" == false ]] && [[ -n "$(git log --all -1 --format=%H -- "$encrypted_file")" ]]; then
    echo '::error::The persistent signing key was removed from the repository. Refusing to create a different signing identity.'
    exit 1
  fi
  new_key=true
  echo 'Initializing a new permanent Reuz signing certificate.'
  keytool -genkeypair -noprompt \
    -keystore "$key_file" -storetype PKCS12 \
    -alias reuz -keyalg RSA -keysize 3072 -sigalg SHA256withRSA \
    -validity 36500 \
    -dname 'CN=Reuz, OU=Android, O=RezoxNemesis, C=IN' \
    -storepass:env REUZ_CI_STORE_PASSWORD \
    -keypass:env REUZ_CI_STORE_PASSWORD >/dev/null 2>&1
  expected_digest="$(sha256sum "$key_file" | cut -d' ' -f1)"
  mkdir -p "$(dirname "$encrypted_file")"
  openssl enc -e -aes-256-cbc -salt -pbkdf2 -iter 600000 \
    -in "$key_file" -out "$encrypted_file" \
    -pass env:REUZ_SIGNING_ENCRYPTION_SECRET >/dev/null 2>&1
  rm -f "$key_file"
  decrypt_key
  actual_digest="$(sha256sum "$key_file" | cut -d' ' -f1)"
  if [[ "$actual_digest" != "$expected_digest" ]]; then
    echo '::error::Encrypted signing key failed exact round-trip verification.'
    exit 1
  fi
fi

if ! keytool -list -v -storetype PKCS12 -keystore "$key_file" \
    -storepass:env REUZ_CI_STORE_PASSWORD -alias reuz 2>/dev/null \
    | grep -q 'Entry type: PrivateKeyEntry'; then
  echo '::error::The permanent release signing key could not be validated.'
  exit 1
fi

if [[ "$self_test" == true ]]; then
  # Check second-run reuse, not just first-run creation.
  first_digest="$(sha256sum "$key_file" | cut -d' ' -f1)"
  rm -f "$key_file"
  decrypt_key
  second_digest="$(sha256sum "$key_file" | cut -d' ' -f1)"
  if [[ "$first_digest" != "$second_digest" ]]; then
    echo '::error::Self-test failed to reuse the signing key.'
    exit 1
  fi
  rm -f "$key_file" "$encrypted_file"
  echo 'Permanent signing initialization/reuse self-test passed.'
  exit 0
fi

if [[ "$new_key" == true ]]; then
  # Commit only encrypted material. GITHUB_TOKEN changes do not trigger
  # additional workflows, so this build continues with the same new key.
  git config user.name 'github-actions[bot]'
  git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git add -- "$encrypted_file"
  git commit -m 'chore(signing): persist encrypted release certificate [skip ci]'
  git push origin HEAD:refs/heads/main
  echo 'Permanent signing certificate securely initialized and saved.'
fi

{
  printf 'REUZ_KEYSTORE=%s\n' "$key_file"
  printf 'REUZ_KEYSTORE_PASSWORD=%s\n' "$REUZ_CI_STORE_PASSWORD"
  printf 'REUZ_KEY_ALIAS=reuz\n'
} >> "${GITHUB_ENV:?GitHub Actions environment file is required}"
echo 'Reuz release signing identity ready.'
