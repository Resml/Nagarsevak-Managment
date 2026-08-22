<#
.SYNOPSIS
Letter Approval Notification System - Deployment Script

.DESCRIPTION
This script helps automate the deployment process natively on Windows PowerShell.
#>

$ErrorActionPreference = "Stop"

$SECRETS_FILE = ".deploy-secrets.tmp"

Write-Host "🚀 Letter Approval Notification System - Deployment" -ForegroundColor Yellow
Write-Host "=================================================="

# Check for Node.js (npx)
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js (npx) not found" -ForegroundColor Red
    Write-Host "Please install Node.js."
    exit 1
}

if (-not (Test-Path "supabase\.temp\project-ref") -and -not $env:SUPABASE_PROJECT_REF) {
    Write-Host "Project not linked. Let's link it now..." -ForegroundColor Yellow
    $PROJECT_REF = Read-Host "Enter your Supabase project ref"
    npx --yes supabase link --project-ref "$PROJECT_REF"
}

# ==============================================================================
# Step 1: Secure Secret Generation
# ==============================================================================
Write-Host "`nStep 1: Generate Webhook Secrets" -ForegroundColor Yellow

# Native PowerShell generation of 64-character hex strings (equivalent to openssl rand -hex 32)
$WEBHOOK_SECRET = -join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Minimum 0 -Maximum 16) })
$DB_WEBHOOK_SECRET = -join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Minimum 0 -Maximum 16) })

# Write to ephemeral un-tracked file to avoid stdout/logs exposure
$secretContent = @"
WEBHOOK_SECRET=$WEBHOOK_SECRET
DB_WEBHOOK_SECRET=$DB_WEBHOOK_SECRET
"@
Set-Content -Path $SECRETS_FILE -Value $secretContent -Force

Write-Host "✅ Secrets generated securely and saved to $SECRETS_FILE" -ForegroundColor Green
Write-Host "⚠️  DO NOT commit this file. It will be deleted automatically later."

# ==============================================================================
# Step 2: Supabase Edge Function Configuration
# ==============================================================================
Write-Host "`nStep 2: Set Supabase Secrets" -ForegroundColor Yellow

Write-Host "Setting BOT_WEBHOOK_URL..."
npx --yes supabase secrets set BOT_WEBHOOK_URL="https://nagarsevak-managment-1.onrender.com"

Write-Host "Setting WEBHOOK_SECRET (for Render bot auth)..."
npx --yes supabase secrets set WEBHOOK_SECRET="$WEBHOOK_SECRET"

Write-Host "Setting DB_WEBHOOK_SECRET (for Database webhook auth)..."
npx --yes supabase secrets set DB_WEBHOOK_SECRET="$DB_WEBHOOK_SECRET"

Write-Host "✅ Edge Function secrets configured successfully" -ForegroundColor Green

# ==============================================================================
# Step 3: Deploy Supabase Edge Function
# ==============================================================================
Write-Host "`nStep 3: Deploy Supabase Edge Function" -ForegroundColor Yellow
Write-Host "Deploying 'notify-letter-status'..."

try {
    npx --yes supabase functions deploy notify-letter-status
    Write-Host "✅ Edge Function deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Edge Function deployment failed" -ForegroundColor Red
    exit 1
}

# ==============================================================================
# Step 4: Render Configuration (Manual)
# ==============================================================================
Write-Host "`nStep 4: Configure Render Environment Variable" -ForegroundColor Yellow
Write-Host "1. Go to: https://dashboard.render.com"
Write-Host "2. Select your bot service: nagarsevak-managment-1"
Write-Host "3. Go to Environment tab"
Write-Host "4. Update/Add environment variable:"
Write-Host "   Key: WEBHOOK_SECRET"
Write-Host "   Value: (Read from $SECRETS_FILE)" -ForegroundColor Red
Write-Host "5. Click 'Save Changes' (bot will auto-redeploy)"
Write-Host ""
Read-Host "Press Enter when Render configuration is complete..."

# ==============================================================================
# Step 5: Configure Database Webhook (Manual)
# ==============================================================================
Write-Host "`nStep 5: Configure Database Webhook" -ForegroundColor Yellow
Write-Host "⚠️  This step must be done manually in Supabase Dashboard:"
Write-Host "1. Go to: https://app.supabase.com/project/_/database/webhooks"
Write-Host "2. Edit existing 'notify-letter-status-webhook'"
Write-Host "3. Delete any old 'Authorization: Bearer' headers."
Write-Host "4. Add NEW HTTP Header:"
Write-Host "   - Key: Webhook-Secret"
Write-Host "   - Value: (Read DB_WEBHOOK_SECRET from $SECRETS_FILE)" -ForegroundColor Red
Write-Host "5. Click 'Save Webhook'"
Write-Host ""
Read-Host "Press Enter when database webhook is re-configured..."

# ==============================================================================
# Step 6: Cleanup & Test Instructions
# ==============================================================================
Write-Host "`nStep 6: Cleanup" -ForegroundColor Yellow
Write-Host "Please confirm that you have successfully copied and configured:"
Write-Host "1. WEBHOOK_SECRET in Render"
Write-Host "2. DB_WEBHOOK_SECRET in Supabase Database Webhooks"
Read-Host "Press Enter to securely delete $SECRETS_FILE and finish..."

Remove-Item -Path $SECRETS_FILE -Force
Write-Host "`n✅ Temporary secrets file deleted." -ForegroundColor Green

Write-Host "`nStep 7: Test the System" -ForegroundColor Yellow
Write-Host "To test the notification system:"
Write-Host "1. Go to your Supabase Dashboard -> Table Editor -> letter_requests"
Write-Host "2. Find a request with status='Pending' and update it to 'Approved'"
Write-Host "3. User should receive WhatsApp notification."
Write-Host ""
Write-Host "Check Edge Function logs if it fails:"
Write-Host "https://app.supabase.com/project/_/functions/notify-letter-status/logs"

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
