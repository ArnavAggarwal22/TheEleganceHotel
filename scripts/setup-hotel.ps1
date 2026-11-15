# One-time setup for The Elegance Hotel's Supabase project (run again any time; it's safe).
#
# Run from the project root in PowerShell (Windows):
#   powershell -ExecutionPolicy Bypass -File scripts\setup-hotel.ps1
#
# Needs: `npx supabase login` done once, and .env.local with SUPABASE_URL (see .env.example).
# It:
#   1. links this folder to the project and applies the database (tables, rules, room types)
#   2. deploys the "notify" Edge Function (booking and contact emails)
#   3. sets sign-in basics: site address, 12-character passwords, authenticator codes for the team
#   4. asks for the Gmail app password of the hotel's email (typing hidden) and uses it to send
#      booking alerts and guests' sign-up / password-reset codes
#   5. switches guest sign-up on once email works, with 6-digit email codes
#   6. optionally switches on "Continue with Google"
# Passwords and secrets go straight to Supabase; nothing is written to disk. Press Enter to skip a question.

param(
  [string]$GmailUser = 'theelegancehotelchd@gmail.com',
  [string]$SiteUrl = 'https://www.theelegancehotel.com'
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$cli = Join-Path (Get-Location) 'node_modules\supabase\dist\supabase.js'

$envLine = Get-Content .env.local -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*SUPABASE_URL\s*=' } | Select-Object -First 1
if (-not $envLine -or $envLine -notmatch 'https://([a-z0-9]+)\.supabase\.co') {
  throw 'Put SUPABASE_URL=https://<project-ref>.supabase.co in .env.local first (see .env.example).'
}
$ProjectRef = $Matches[1]
Write-Host "Project: $ProjectRef" -ForegroundColor Cyan

function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }
function Plain([Security.SecureString]$s) {
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

# --- Supabase login (the token the CLI saved with `npx supabase login`) ---
$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
  Add-Type -Namespace EleganceSetup -Name Cred -MemberDefinition @'
[DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
public static extern bool CredRead(string target, int type, int flags, out IntPtr cred);
[DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct CREDENTIAL { public int Flags; public int Type; public string TargetName; public string Comment;
  public long LastWritten; public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
  public int AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName; }
'@
  $ptr = [IntPtr]::Zero
  if (-not [EleganceSetup.Cred]::CredRead('Supabase CLI:supabase', 1, 0, [ref]$ptr)) {
    throw 'Not logged in to Supabase. Run: npx supabase login'
  }
  $c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][EleganceSetup.Cred+CREDENTIAL])
  $bytes = New-Object byte[] $c.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bytes, 0, $c.CredentialBlobSize)
  [EleganceSetup.Cred]::CredFree($ptr)
  $token = [Text.Encoding]::UTF8.GetString($bytes)
  if ($token -like 'go-keyring-base64:*') { $token = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($token.Substring(18))) }
}
$api = "https://api.supabase.com/v1/projects/$ProjectRef"
$headers = @{ Authorization = "Bearer $token" }
function Api($method, $path, $body) {
  $params = @{ Method = $method; Uri = "$api$path"; Headers = $headers }
  if ($null -ne $body) { $params.ContentType = 'application/json'; $params.Body = ($body | ConvertTo-Json -Depth 5) }
  Invoke-RestMethod @params
}

# --- 1. Database changes ---
Step 'Linking this folder to the project'
node $cli link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw 'Linking failed (see above). Run npx supabase login first.' }

Step 'Applying database changes (and the starting room types)'
node $cli db push --linked --yes --include-seed
if ($LASTEXITCODE -ne 0) { throw 'Database update failed (see above).' }

# --- 2. Booking alert function ---
Step 'Deploying the email function'
node $cli functions deploy notify --project-ref $ProjectRef --use-api
if ($LASTEXITCODE -ne 0) { throw 'Function deploy failed (see above).' }

Step 'Sign-in basics'
Api 'PATCH' '/config/auth' @{
  site_url = $SiteUrl
  uri_allow_list = "$SiteUrl/**,https://theelegancehotel.com/**,http://localhost:5173/**"
  password_min_length = 12
  mfa_totp_enroll_enabled = $true
  mfa_totp_verify_enabled = $true
} | Out-Null
Write-Host "Site address: $SiteUrl. Passwords: 12+ characters. Team two-step codes: on." -ForegroundColor Green

# --- 3. Gmail sending ---
Step "Email sending from $GmailUser"
Write-Host 'Create an app password at https://myaccount.google.com/apppasswords (needs 2-Step Verification on),'
Write-Host 'then paste it here. Typing is hidden. Press Enter to skip.'
$gmailPassword = (Plain (Read-Host 'Gmail app password' -AsSecureString)) -replace '\s', ''
$emailReady = $false
if ($gmailPassword) {
  Api 'POST' '/secrets' @(
    @{ name = 'GMAIL_USER'; value = $GmailUser },
    @{ name = 'GMAIL_APP_PASSWORD'; value = $gmailPassword },
    @{ name = 'TEAM_EMAIL'; value = $GmailUser },
    @{ name = 'SITE_URL'; value = $SiteUrl }
  ) | Out-Null
  Api 'PATCH' '/config/auth' @{
    smtp_admin_email = $GmailUser
    smtp_sender_name = 'The Elegance Hotel'
    smtp_host = 'smtp.gmail.com'
    smtp_port = '465'
    smtp_user = $GmailUser
    smtp_pass = $gmailPassword
    rate_limit_email_sent = 100
  } | Out-Null
  $emailReady = $true
  Write-Host 'Saved: booking alerts and account emails now send from Gmail.' -ForegroundColor Green
} else {
  $current = Api 'GET' '/config/auth' $null
  $emailReady = [bool]$current.smtp_host
  Write-Host ('Skipped. ' + ($(if ($emailReady) { 'Email sending was already set up.' } else { 'Guest sign-up stays off until email works.' })))
}

# --- 4. Guest sign-up with 6-digit email codes ---
Step 'Customer accounts'
$codeEmail = @'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
  <div style="font-family:Georgia,serif;font-size:24px;margin-bottom:4px">The Elegance Hotel</div>
  <div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#8C6D3B;margin-bottom:18px">by Ambience</div>
  <p style="font-size:15px">{0}</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">{{ .Token }}</p>
  <p style="font-size:13px;color:#6b7280">The code works for one hour. If you didn't ask for it, you can ignore this email.</p>
</div>
'@
$auth = @{
  mailer_otp_length = 6
  mailer_otp_exp = 3600
  mailer_autoconfirm = $false
  mailer_subjects_confirmation = 'Your Elegance Hotel code: {{ .Token }}'
  mailer_templates_confirmation_content = ($codeEmail.Replace('{0}', 'Welcome to The Elegance Hotel! Enter this code on the website to confirm your email:'))
  mailer_subjects_recovery = 'Your Elegance Hotel password reset code: {{ .Token }}'
  mailer_templates_recovery_content = ($codeEmail.Replace('{0}', 'Enter this code on the website to choose a new password:'))
}
# Supabase only allows custom email templates once a custom sender (Gmail here) is set up.
if ($emailReady) {
  $auth.disable_signup = $false
  Api 'PATCH' '/config/auth' $auth | Out-Null
  Write-Host 'Guest sign-up is ON (email + password, confirmed with a 6-digit code).' -ForegroundColor Green
} else {
  Write-Host 'Skipped: guest sign-up stays OFF until the Gmail app password is added (run this script again).' -ForegroundColor Yellow
}

# --- 5. Google sign-in ---
Step 'Continue with Google (optional)'
Write-Host "Redirect URI to give Google: https://$ProjectRef.supabase.co/auth/v1/callback"
$googleId = (Read-Host 'Google OAuth Client ID (Enter to skip)').Trim()
if ($googleId) {
  $googleSecret = (Plain (Read-Host 'Google OAuth Client Secret (hidden)' -AsSecureString)).Trim()
  if ($googleSecret) {
    Api 'PATCH' '/config/auth' @{
      external_google_enabled = $true
      external_google_client_id = $googleId
      external_google_secret = $googleSecret
    } | Out-Null
    Write-Host '"Continue with Google" is ON.' -ForegroundColor Green
  }
}

$final = Api 'GET' '/config/auth' $null
Step 'Done'
Write-Host ("Sign-up: " + $(if ($final.disable_signup) { 'off' } else { 'on' }) +
  " | Email sender: " + $(if ($final.smtp_host) { $final.smtp_user } else { 'Supabase default (limited)' }) +
  " | Google: " + $(if ($final.external_google_enabled) { 'on' } else { 'off' }))
