#!/bin/bash

# Script to generate AWS_README.md from README.md
# 1. Removes content between <!--<EXCLUDE_AWS_README>--> and <!--</EXCLUDE_AWS_README>--> tags
# 2. Keeps content between <INCLUDE_AWS_README> and </INCLUDE_AWS_README>tags (removes the comment wrappers)
# 3. Keeps all other content that's not in EXCLUDE blocks

INPUT_FILE="README.md"
OUTPUT_FILE="AWS_README.md"

# Check if README.md exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found!"
    exit 1
fi

# Process the file using awk:
# - Skip content between <!--<EXCLUDE_AWS_README>--> and <!--</EXCLUDE_AWS_README>--> tags (including tags)
# - Remove comment wrappers for <INCLUDE_AWS_README> tags but keep content inside
# - Print everything else that's not excluded
awk '
    /<!--<EXCLUDE_AWS_README>-->/ {
        exclude_block = 1
        next
    }
    /<!--<\/EXCLUDE_AWS_README>-->/ {
        exclude_block = 0
        next
    }
    /<!--<INCLUDE_AWS_README>/ {
        next
    }
    /<\/INCLUDE_AWS_README>-->/ {
        next
    }
    !exclude_block {
        print
    }
' "$INPUT_FILE" > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE from $INPUT_FILE"
echo "Done!"
