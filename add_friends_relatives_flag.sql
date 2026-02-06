-- Add is_friend_relative column to voters table
ALTER TABLE voters ADD COLUMN IF NOT EXISTS is_friend_relative BOOLEAN DEFAULT false;
