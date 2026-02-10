#!/bin/bash

# Letter Approval Notification System - Deployment Script
# This script helps automate the deployment process

echo "🚀 Letter Approval Notification System - Deployment"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Generate Webhook Secret
echo -e "${YELLOW}Step 1: Generate Webhook Secret${NC}"
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "Generated secret: $WEBHOOK_SECRET"
echo ""
echo -e "${GREEN}✅ Copy this secret - you'll need it for Render and Supabase${NC}"
echo ""

# Step 2: Render Configuration
echo -e "${YELLOW}Step 2: Configure Render Environment Variable${NC}"
echo "1. Go to: https://dashboard.render.com"
echo "2. Select your bot service: nagarsevak-managment-1"
echo "3. Go to Environment tab"
echo "4. Add new environment variable:"
echo "   Key: WEBHOOK_SECRET"
echo "   Value: $WEBHOOK_SECRET"
echo "5. Click 'Save Changes' (bot will auto-redeploy)"
echo ""
read -p "Press Enter when Render configuration is complete..."
echo ""

# Step 3: Deploy Supabase Edge Function
echo -e "${YELLOW}Step 3: Deploy Supabase Edge Function${NC}"
echo "Running: supabase functions deploy notify-letter-status"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it: npm install -g supabase"
    echo "Then run this script again"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "Project not linked. Let's link it now..."
    read -p "Enter your Supabase project ref: " PROJECT_REF
    supabase link --project-ref $PROJECT_REF
fi

# Deploy function
supabase functions deploy notify-letter-status

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Edge Function deployed successfully${NC}"
else
    echo -e "${RED}❌ Edge Function deployment failed${NC}"
    echo "Try manually: supabase functions deploy notify-letter-status"
    exit 1
fi
echo ""

# Step 4: Set Supabase Secrets
echo -e "${YELLOW}Step 4: Set Supabase Secrets${NC}"
echo "Setting BOT_WEBHOOK_URL..."
supabase secrets set BOT_WEBHOOK_URL=https://nagarsevak-managment-1.onrender.com

echo "Setting WEBHOOK_SECRET..."
supabase secrets set WEBHOOK_SECRET=$WEBHOOK_SECRET

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Secrets configured successfully${NC}"
else
    echo -e "${RED}❌ Failed to set secrets${NC}"
    exit 1
fi
echo ""

# Step 5: Configure Database Webhook
echo -e "${YELLOW}Step 5: Configure Database Webhook${NC}"
echo "⚠️  This step must be done manually in Supabase Dashboard:"
echo ""
echo "1. Go to: https://app.supabase.com/project/YOUR_PROJECT/database/webhooks"
echo "2. Click 'Create a new hook'"
echo "3. Configure:"
echo "   - Name: notify-letter-status-webhook"
echo "   - Table: letter_requests"
echo "   - Events: ☑️ Update (only)"
echo "   - Type: HTTP Request"
echo "   - Method: POST"
echo "   - URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-letter-status"
echo "4. Add HTTP Header:"
echo "   - Key: Authorization"
echo "   - Value: Bearer YOUR_SUPABASE_ANON_KEY"
echo "5. Click 'Create webhook'"
echo ""
read -p "Press Enter when database webhook is configured..."
echo ""

# Step 6: Test
echo -e "${YELLOW}Step 6: Test the System${NC}"
echo "To test the notification system:"
echo "1. Go to your Supabase Dashboard"
echo "2. Find a letter_request with status='Pending'"
echo "3. Update status to 'Approved' or 'Rejected'"
echo "4. User should receive WhatsApp notification"
echo ""
echo "Check logs:"
echo "  - Supabase: https://app.supabase.com/project/YOUR_PROJECT/functions/notify-letter-status/logs"
echo "  - Render: https://dashboard.render.com (your bot service logs)"
echo ""

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Webhook Secret (save this): $WEBHOOK_SECRET"
echo ""
