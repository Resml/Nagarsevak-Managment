#!/usr/bin/env python3
import re

# Read the file
with open('bot/menuNavigator.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken multi-line strings by replacing literal newlines with \n
# The issue is that template strings have actual newlines in the middle breaking syntax

# Pattern 1: Fix the moreMsg strings (lines 585-590)
content = re.sub(
    r"const moreMsg = lang === 'en' \? '\n📄 Send",
    r"const moreMsg = lang === 'en' ? '\\n📄 Send",
    content
)

content = re.sub(
    r"lang === 'mr' \? '\n📄 अधिक",
    r"lang === 'mr' ? '\\n📄 अधिक",
    content
)

content = re.sub(
    r"'\n📄 अधिक योजनाएं",
    r"'\\n📄 अधिक योजनाएं",
    content
)

# Write back
with open('bot/menuNavigator.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed template string syntax errors")
