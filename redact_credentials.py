#!/usr/bin/env python3
"""
Redact sensitive credentials from files in git history filter
"""
import os
import sys

credentials_to_redact = [
    ("Dipendra@159357", "REDACTED_PASSWORD"),
    ("e9EJMSt9OiwiNE-JgB7hvgrtabxWuvmymohdHn39zUs", "REDACTED_SECRET_KEY"),
    ("msoahnrvdwyclxkcbiin", "REDACTED_PROJECT_ID"),
    ("AnandSmith%40123", "REDACTED_PASSWORD_CURRENT"),  # Also redact current one for safety
]

file_extensions = ('.md', '.txt', '.env', '.py', '.json')

for root, dirs, files in os.walk('.'):
    # Skip .git directory
    if '.git' in dirs:
        dirs.remove('.git')
    
    for file in files:
        if file.endswith(file_extensions) or file.startswith('.env'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                modified = False
                for old, new in credentials_to_redact:
                    if old in content:
                        content = content.replace(old, new)
                        modified = True
                
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Redacted: {filepath}")
            except Exception as e:
                print(f"Error processing {filepath}: {e}", file=sys.stderr)
