#!/usr/bin/env python3
"""Build extension zips from an explicit allowlist; verify bytes after writing."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


def main():
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / 'manifest.json').read_text())
    version = manifest['version']
    files = ['manifest.json', 'parsing.js', 'content.js', 'popup.html', 'popup.css', 'popup.js']
    files += sorted(set(manifest['icons'].values()))
    if (root / 'VERSION').read_text().strip() != version:
        raise SystemExit('VERSION and manifest version must match')
    for name in [f'inbox-cleaner-extension-{version}.zip', 'inbox-cleaner-extension.zip']:
        path = root / name
        with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
            for filename in files:
                archive.write(root / filename, filename)
        with ZipFile(path) as archive:
            assert sorted(archive.namelist()) == sorted(files)
            for filename in files:
                assert archive.read(filename) == (root / filename).read_bytes(), filename
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        print(f'{name}: {version}, {len(files)} files, sha256 {digest}')


if __name__ == '__main__':
    main()
