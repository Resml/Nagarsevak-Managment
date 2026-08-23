#!/bin/bash
set -euo pipefail

# ==============================================================================
# Letter Approval Notification System - Deployment Script
# ==============================================================================
# WARNING: Run this script ONLY in Git Bash (recommended on Windows) or WSL. 
# Do NOT use PowerShell for executing bash scripts natively.
# ==============================================================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
SECRETS_FILE=".deploy-secrets.tmp"

echo -e "${YELLOW}🚀 Letter Approval Notification System - Deployment${NC}"
echo "=================================================="

# Check requirements
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it: npm install -g supabase or via Scoop/Brew."
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL not found${NC}"
    echo "Please install OpenSSL or use Git Bash which includes it."
    exit 1
fi

if [ ! -f "supabase/.temp/project-ref" ] && [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
    echo -e "${YELLOW}Project not linked. Let's link it now...${NC}"
    read -p "Enter your Supabase project ref: " PROJECT_REF
    supabase link --project-ref "$PROJECT_REF"
fi

# ==============================================================================
# Step 1: Secure Secret Generation
# ==============================================================================
echo -e "\n${YELLOW}Step 1: Generate Webhook Secrets${NC}"
WEBHOOK_SECRET=$(openssl rand -hex 32)
DB_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Write to ephemeral un-tracked file to avoid stdout/logs exposure
touch "$SECRETS_FILE"
chmod 600 "$SECRETS_FILE"
echo "WEBHOOK_SECRET=${WEBHOOK_SECRET}" > "$SECRETS_FILE"
echo "DB_WEBHOOK_SECRET=${DB_WEBHOOK_SECRET}" >> "$SECRETS_FILE"

echo -e "${GREEN}✅ Secrets generated securely and saved to $SECRETS_FILE${NC}"
echo "⚠️  DO NOT commit this file. It will be deleted automatically later."

# ==============================================================================
# Step 2: Supabase Edge Function Configuration
# ==============================================================================
echo -e "\n${YELLOW}Step 2: Set Supabase Secrets${NC}"

# Configure secrets in Supabase BEFORE deployment
echo "Setting BOT_WEBHOOK_URL..."
supabase secrets set BOT_WEBHOOK_URL="https://nagarsevak-managment-1.onrender.com"

echo "Setting WEBHOOK_SECRET (for Render bot auth)..."
supabase secrets set WEBHOOK_SECRET="$WEBHOOK_SECRET"

echo "Setting DB_WEBHOOK_SECRET (for Database webhook auth)..."
supabase secrets set DB_WEBHOOK_SECRET="$DB_WEBHOOK_SECRET"

echo -e "${GREEN}✅ Edge Function secrets configured successfully${NC}"

# ==============================================================================
# Step 3: Deploy Supabase Edge Function
# ==============================================================================
echo -e "\n${YELLOW}Step 3: Deploy Supabase Edge Function${NC}"
echo "Deploying 'notify-letter-status'..."

if supabase functions deploy notify-letter-status; then
    echo -e "${GREEN}✅ Edge Function deployed successfully${NC}"
else
    echo -e "${RED}❌ Edge Function deployment failed${NC}"
    exit 1
fi

# ==============================================================================
# Step 4: Render Configuration (Manual)
# ==============================================================================
echo -e "\n${YELLOW}Step 4: Configure Render Environment Variable${NC}"
echo "1. Go to: https://dashboard.render.com"
echo "2. Select your bot service: nagarsevak-managment-1"
echo "3. Go to Environment tab"
echo "4. Update/Add environment variable:"
echo "   Key: WEBHOOK_SECRET"
echo -e "   Value: ${RED}(Read from $SECRETS_FILE)${NC}"
echo "5. Click 'Save Changes' (bot will auto-redeploy)"
echo ""
read -p "Press Enter when Render configuration is complete..."

# ==============================================================================
# Step 5: Configure Database Webhook (Manual)
# ==============================================================================
echo -e "\n${YELLOW}Step 5: Configure Database Webhook${NC}"
echo "⚠️  This step must be done manually in Supabase Dashboard:"
echo "1. Go to: https://app.supabase.com/project/_/database/webhooks"
echo "2. Edit existing 'notify-letter-status-webhook'"
echo "3. Delete any old 'Authorization: Bearer' headers."
echo "4. Add NEW HTTP Header:"
echo "   - Key: Webhook-Secret"
echo -e "   - Value: ${RED}(Read DB_WEBHOOK_SECRET from $SECRETS_FILE)${NC}"
echo "5. Click 'Save Webhook'"
echo ""
read -p "Press Enter when database webhook is re-configured..."

# ==============================================================================
# Step 6: Cleanup & Test Instructions
# ==============================================================================
echo -e "\n${YELLOW}Step 6: Cleanup${NC}"
echo "Please confirm that you have successfully copied and configured:"
echo "1. WEBHOOK_SECRET in Render"
echo "2. DB_WEBHOOK_SECRET in Supabase Database Webhooks"
read -p "Press Enter to securely delete $SECRETS_FILE and finish..."

rm -f "$SECRETS_FILE"
echo -e "\n${GREEN}✅ Temporary secrets file deleted.${NC}"

echo -e "\n${YELLOW}Step 7: Test the System${NC}"
echo "To test the notification system:"
echo "1. Go to your Supabase Dashboard -> Table Editor -> letter_requests"
echo "2. Find a request with status='Pending' and update it to 'Approved'"
echo "3. User should receive WhatsApp notification."
echo ""
echo "Check Edge Function logs if it fails:"
echo "https://app.supabase.com/project/_/functions/notify-letter-status/logs"

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
