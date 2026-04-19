#!/bin/bash
# Redact exposed credentials from git history

find . -type f \( -name "*.md" -o -name "*.txt" -o -name ".env*" \) ! -path "./.git/*" -exec sed -i 's/Dipendra@159357/REDACTED_PASSWORD/g' {} +
find . -type f \( -name "*.md" -o -name "*.txt" -o -name ".env*" \) ! -path "./.git/*" -exec sed -i 's/e9EJMSt9OiwiNE-JgB7hvgrtabxWuvmymohdHn39zUs/REDACTED_SECRET_KEY/g' {} +
find . -type f \( -name "*.md" -o -name "*.txt" -o -name ".env*" \) ! -path "./.git/*" -exec sed -i 's/msoahnrvdwyclxkcbiin/REDACTED_PROJECT_ID/g' {} +
