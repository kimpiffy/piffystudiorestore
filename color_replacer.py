#!/usr/bin/env python3
"""Script to replace color variables across CSS files"""

import os
import re

def replace_in_file(filepath, old_text, new_text):
    """Replace text in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_text in content:
            content = content.replace(old_text, new_text)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}: {old_text} -> {new_text}")
        else:
            print(f"No matches found in {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Find all CSS files
css_files = []
for root, dirs, files in os.walk('/workspaces/piffystudiorestore'):
    for file in files:
        if file.endswith('.css'):
            css_files.append(os.path.join(root, file))

print(f"Found {len(css_files)} CSS files")

# Replace var(--green) with var(--orange) in all CSS files
# Replace var(--green) with var(--uranium) in all CSS files
for css_file in css_files:
    replace_in_file(css_file, 'var(--green)', 'var(--uranium)')

print("Finished updating CSS files")