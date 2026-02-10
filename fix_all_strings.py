#!/usr/bin/env python3
# Fix all broken template strings with literal newlines

with open('bot/menuNavigator.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix pattern: '  with newline after it
fixed_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this line ends with ' and next line starts with emoji (broken string)
    if i < len(lines) - 1 and line.rstrip().endswith("= lang === 'en' ? '"):
        # This is start of a broken multi-line string
        # Collect the string parts
        current_line = line.rstrip()[:-1]  # Remove the trailing '
        current_line += "'\\n"  # Add escaped newline
        i += 1
        
        # Get the content line
        content = lines[i].strip()
        # Remove trailing quote and colon if present
        if content.endswith("' :"):
            content = content[:-3]
        elif content.endswith("';"):
            content = content[:-2]
        elif content.endswith("'"):
            content = content[:-1]
            
        current_line += content + "' :"
        
        fixed_lines.append(current_line + '\n')
        i += 1
        continue
    elif i < len(lines) - 1 and ("lang === 'mr' ? '" in line or "lang === 'hi' ? '" in line) and line.rstrip().endswith("'"):
        # Middle or end of ternary
        current_line = line.rstrip()[:-1]  # Remove trailing '
        current_line += "'\\n"
        i += 1
        
        content = lines[i].strip()
        if content.endswith("' :"):
            content = content[:-3]
        elif content.endswith("';"):
            content = content[:-2]
        elif content.endswith("'"):
            content = content[:-1]
            
        if "' :" in line or ": '" in line:
            current_line += content + "' :"
        else:
            current_line += content + "';"
            
        fixed_lines.append(current_line + '\n')
        i += 1
        continue
    elif i < len(lines) - 1 and line.rstrip().endswith("'"):
        # Check if next line is emoji (continuation)
        next_line = lines[i+1].strip()
        if next_line.startswith('📄') or next_line.startswith('🔍') or next_line.startswith('👤'):
            current_line = line.rstrip()[:-1]  # Remove trailing '
            current_line += "'\\n"
            i += 1
            
            content = lines[i].strip()
            if content.endswith("';"):
                content = content[:-2]
            elif content.endswith("'"):
                content = content[:-1]
                
            current_line += content + "';"
            fixed_lines.append(current_line + '\n')
            i += 1
            continue
    
    fixed_lines.append(line)
    i += 1

# Write back
with open('bot/menuNavigator.js', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("✅ Fixed all broken multi-line strings")
