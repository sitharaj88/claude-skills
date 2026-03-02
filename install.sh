#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SOURCE="$SCRIPT_DIR/skills"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Install Claude Code skills via symlinks.

Options:
  --scope personal    Install to ~/.claude/skills/ (default)
  --scope project     Install to ./.claude/skills/
  --all               Install all skills
  --pick              Interactive skill picker
  --skill NAME        Install a specific skill by name
  --uninstall         Remove installed symlinks
  -h, --help          Show this help message

Examples:
  $(basename "$0") --all                          # Install all to ~/.claude/skills/
  $(basename "$0") --scope project --all          # Install all to ./.claude/skills/
  $(basename "$0") --skill smart-commit           # Install one skill
  $(basename "$0") --pick                         # Choose interactively
  $(basename "$0") --uninstall                    # Remove symlinks
EOF
}

SCOPE="personal"
MODE=""
SKILL_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --scope) SCOPE="$2"; shift 2 ;;
        --all) MODE="all"; shift ;;
        --pick) MODE="pick"; shift ;;
        --skill) MODE="single"; SKILL_NAME="$2"; shift 2 ;;
        --uninstall) MODE="uninstall"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; usage; exit 1 ;;
    esac
done

if [[ -z "$MODE" ]]; then
    echo -e "${RED}Error: Specify --all, --pick, --skill NAME, or --uninstall${NC}"
    usage
    exit 1
fi

# Determine target directory
if [[ "$SCOPE" == "personal" ]]; then
    TARGET_DIR="$HOME/.claude/skills"
elif [[ "$SCOPE" == "project" ]]; then
    TARGET_DIR="./.claude/skills"
else
    echo -e "${RED}Error: Invalid scope '$SCOPE'. Use 'personal' or 'project'.${NC}"
    exit 1
fi

install_skill() {
    local skill_name="$1"
    local source="$SKILLS_SOURCE/$skill_name"
    local target="$TARGET_DIR/$skill_name"

    if [[ ! -d "$source" ]]; then
        echo -e "${RED}Skill not found: $skill_name${NC}"
        return 1
    fi

    if [[ -e "$target" ]]; then
        if [[ -L "$target" ]]; then
            echo -e "${YELLOW}Already installed: $skill_name (updating symlink)${NC}"
            rm "$target"
        else
            echo -e "${YELLOW}Warning: $target exists and is not a symlink. Skipping.${NC}"
            return 0
        fi
    fi

    ln -s "$source" "$target"
    echo -e "${GREEN}Installed: $skill_name${NC}"
}

uninstall_skills() {
    if [[ ! -d "$TARGET_DIR" ]]; then
        echo -e "${YELLOW}No skills directory found at $TARGET_DIR${NC}"
        return 0
    fi

    local count=0
    for link in "$TARGET_DIR"/*/; do
        link="${link%/}"
        if [[ -L "$link" ]]; then
            local link_target
            link_target="$(readlink "$link")"
            if [[ "$link_target" == "$SKILLS_SOURCE"* ]]; then
                rm "$link"
                echo -e "${GREEN}Removed: $(basename "$link")${NC}"
                ((count++))
            fi
        fi
    done

    if [[ $count -eq 0 ]]; then
        echo -e "${YELLOW}No claude-skills symlinks found in $TARGET_DIR${NC}"
    else
        echo -e "${GREEN}Removed $count skill(s)${NC}"
    fi
}

# Get list of available skills
get_skills() {
    for dir in "$SKILLS_SOURCE"/*/; do
        if [[ -f "$dir/SKILL.md" ]]; then
            basename "$dir"
        fi
    done
}

# Main
mkdir -p "$TARGET_DIR"

case $MODE in
    all)
        echo -e "${BLUE}Installing all skills to $TARGET_DIR${NC}"
        echo ""
        for skill in $(get_skills); do
            install_skill "$skill"
        done
        echo ""
        echo -e "${GREEN}Done! Skills are ready to use with /skill-name in Claude Code.${NC}"
        ;;
    single)
        echo -e "${BLUE}Installing '$SKILL_NAME' to $TARGET_DIR${NC}"
        install_skill "$SKILL_NAME"
        ;;
    pick)
        echo -e "${BLUE}Available skills:${NC}"
        echo ""
        skills=($(get_skills))
        for i in "${!skills[@]}"; do
            echo "  $((i+1)). ${skills[$i]}"
        done
        echo ""
        echo -n "Enter skill numbers (comma-separated) or 'all': "
        read -r selection

        if [[ "$selection" == "all" ]]; then
            for skill in "${skills[@]}"; do
                install_skill "$skill"
            done
        else
            IFS=',' read -ra nums <<< "$selection"
            for num in "${nums[@]}"; do
                num=$(echo "$num" | tr -d ' ')
                idx=$((num - 1))
                if [[ $idx -ge 0 && $idx -lt ${#skills[@]} ]]; then
                    install_skill "${skills[$idx]}"
                else
                    echo -e "${RED}Invalid selection: $num${NC}"
                fi
            done
        fi
        echo ""
        echo -e "${GREEN}Done!${NC}"
        ;;
    uninstall)
        echo -e "${BLUE}Uninstalling skills from $TARGET_DIR${NC}"
        uninstall_skills
        ;;
esac
