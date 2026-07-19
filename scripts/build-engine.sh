#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PYTHON_BIN=${PYTHON_BIN:-python3}

cd "$PROJECT_DIR"
export PYINSTALLER_CONFIG_DIR="$PROJECT_DIR/work/pyinstaller-config"

if ! "$PYTHON_BIN" -c "import PyInstaller, certifi" >/dev/null 2>&1; then
  echo "Mancano PyInstaller o certifi. Installa con:"
  echo "  python3 -m pip install pyinstaller certifi"
  exit 1
fi

"$PYTHON_BIN" -m PyInstaller \
  --noconfirm \
  --clean \
  --onedir \
  --name scraaaper-search-service \
  --distpath dist-bin \
  --workpath work/pyinstaller \
  --specpath work \
  --add-data "$PROJECT_DIR/app.js:web" \
  --add-data "$PROJECT_DIR/index.html:web" \
  --add-data "$PROJECT_DIR/style.css:web" \
  --add-data "$PROJECT_DIR/manifest.webmanifest:web" \
  --add-data "$PROJECT_DIR/icon.svg:web" \
  --add-data "$PROJECT_DIR/sw.js:web" \
  "$PROJECT_DIR/server.py"
