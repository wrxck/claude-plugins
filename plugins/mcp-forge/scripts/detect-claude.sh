#!/bin/bash
# detect claude cli location
for bin in "$(command -v claude 2>/dev/null)" \
           "$HOME/.local/bin/claude" \
           "/usr/local/bin/claude" \
           "/usr/bin/claude"; do
  [ -x "$bin" ] && echo "$bin" && exit 0
done
echo "claude"
