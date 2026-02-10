#!/usr/bin/env python3
import re

# Read the file
with open('bot/menuNavigator.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the new implementation
with open('scheme_handlers_complete.js', 'r', encoding='utf-8') as f:
    new_impl = f.read()

# Extract just the functions we need (skip the comments at the top)
lines = new_impl.split('\n')
start_idx = next(i for i, line in enumerate(lines) if line.startswith('async handleSchemesMenu'))
new_functions = '\n'.join(lines[start_idx:])

# Find and replace the old handleSchemesMenu function
# Pattern: from "async handleSchemesMenu" to the next "/**" (which starts a new JSDoc comment)
pattern = r'(    async handleSchemesMenu\(sock, tenantId, userId, input\).*?)(    /\*\*)'
replacement = new_functions + '\n\n    /**'

# Perform the replacement
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write back
with open('bot/menuNavigator.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully replaced handleSchemesMenu and added 3 new functions!")
print("📝 Updated bot/menuNavigator.js")
