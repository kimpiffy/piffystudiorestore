#!/usr/bin/env bash
# Fully replace the Styles page export with a freshly uploaded InDesign HTML5 package.
#
# Usage:
#   ./update_styles_page.sh /path/to/newly-exported-folder
#
# This does a COMPLETE replace of static/styles/ with the new export - nothing
# is protected/merged here. That's intentional: InDesign exports are treated
# as the new source of truth (fonts, page count, everything), and the site's
# custom patches (transparent stage, fit-to-viewport scaling, arrow glyphs,
# picnic font-face + arrow styling, scalloped edge, cover-page text centering)
# get manually reapplied on top afterwards by whoever integrates it (ask the
# assistant to do this - see /memories/repo/styles-page-indesign-export.md).
#
# portfolio/templates/portfolio/styles.html and static/css/styles-page.css are
# NOT part of the export folder and are never touched by this script.

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/newly-exported-folder"
  exit 1
fi

SRC="$1"
DEST="static/styles"

if [ ! -d "$SRC/publication-web-resources" ]; then
  echo "Error: '$SRC/publication-web-resources' not found. Point this at the exported folder root."
  exit 1
fi

echo "Replacing $DEST with contents of: $SRC"
rsync -a --delete "$SRC/" "$DEST/"

echo "Done. Full export replaced."
echo ""
echo "Next: ask the assistant to reapply the site's custom patches on top of"
echo "the new files (transparent stage/scaling in index.html, picnic font-face"
echo "+ arrow styling in main.css, cover-page KIM/PIFFY centering if present)."


echo "Done. Page count set to ${PAGE_COUNT} in publication-web-resources/script/main.js."
echo ""
echo "NOT touched (our custom site fixes live here):"
echo "  $DEST/index.html"
echo "  $DEST/publication-web-resources/css/main.css"
echo "  $DEST/font/"
echo ""
echo "Note: the cover page (page 1) KIM/PIFFY title alignment was hand-fixed."
echo "If InDesign regenerated that page, ask to have that alignment fix reapplied."
