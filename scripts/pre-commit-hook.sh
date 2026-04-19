#!/bin/bash
# Pre-commit hook to prevent committing secrets
# Place this file in .git/hooks/pre-commit and make it executable

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ERRORS_FOUND=0

echo "🔍 Running pre-commit security checks..."

# 1. Check for .env files being staged
echo "📝 Checking for .env files..."
if git diff --cached --name-only | grep -E "\.env|secrets\.json|credentials\.json"; then
    echo -e "${RED}❌ ERROR: .env or secrets file detected in staging area!${NC}"
    echo "   These should NOT be committed to git."
    echo "   Remove them from staging with: git reset HEAD <filename>"
    ERRORS_FOUND=1
fi

# 2. Check for common secret patterns in staged files
echo "🔐 Checking for hardcoded secrets..."
DANGEROUS_PATTERNS=(
    "password"
    "SECRET_KEY"
    "api_key"
    "apikey"
    "access_token"
    "private_key"
    "AWS_SECRET"
    "SUPABASE_"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if git diff --cached | grep -i "^+.*${pattern}" | grep -v "example\|template\|placeholder"; then
        echo -e "${YELLOW}⚠️  WARNING: Potential secret found matching pattern: ${pattern}${NC}"
        ERRORS_FOUND=1
    fi
done

# 3. Check for large binary files that shouldn't be committed
echo "📦 Checking for large files..."
MAX_SIZE=$((10 * 1024 * 1024))  # 10MB
git diff --cached --name-only | while read file; do
    if [ -f "$REPO_ROOT/$file" ]; then
        SIZE=$(stat -f%z "$REPO_ROOT/$file" 2>/dev/null || stat -c%s "$REPO_ROOT/$file" 2>/dev/null)
        if [ "$SIZE" -gt "$MAX_SIZE" ]; then
            echo -e "${RED}❌ ERROR: Large file detected: ${file} ($(numfmt --to=iec $SIZE 2>/dev/null || echo $SIZE bytes))${NC}"
            echo "   Consider using Git LFS for binary files: git lfs install"
            ERRORS_FOUND=1
        fi
    fi
done

# 4. Check Python files for syntax errors
echo "🐍 Checking Python syntax..."
git diff --cached --name-only --diff-filter=ACM | grep '\.py$' | while read file; do
    if [ -f "$REPO_ROOT/$file" ]; then
        python -m py_compile "$REPO_ROOT/$file" 2>/dev/null || {
            echo -e "${RED}❌ Python syntax error in: ${file}${NC}"
            ERRORS_FOUND=1
        }
    fi
done

# Report results
if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Security checks failed. Commit blocked.${NC}"
    echo "   Fix the issues above before committing."
    exit 1
fi
