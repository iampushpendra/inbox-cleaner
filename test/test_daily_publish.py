import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class DailyPublishTest(unittest.TestCase):
    def test_tracked_user_edits_block_scheduled_generation(self):
        source = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "scripts").mkdir()
            (root / "bin").mkdir()
            shutil.copy(source / "scripts/daily_publish.sh", root / "scripts")
            git = root / "bin/git"
            git.write_text('#!/bin/bash\nif [ "$1" = status ]; then echo " M docs/index.html"; fi\nexit 0\n')
            git.chmod(0o755)
            notify = root / "bin/osascript"
            notify.write_text('#!/bin/bash\nexit 0\n')
            notify.chmod(0o755)
            result = subprocess.run(["bash", str(root / "scripts/daily_publish.sh")], env=dict(os.environ, PATH=f'{root / "bin"}:/usr/bin:/bin'), capture_output=True, timeout=10)
            self.assertEqual(result.returncode, 1)
            self.assertIn("FAILED: tracked working tree has edits", (root / "scripts/daily_publish.log").read_text())

    def test_failed_fetch_is_noninteractive_and_bounded(self):
        """A scheduled network failure must fail promptly without generating a post."""
        source = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "scripts").mkdir()
            (root / "bin").mkdir()
            shutil.copy(source / "scripts/daily_publish.sh", root / "scripts")
            git = root / "bin/git"
            git.write_text(
                '#!/bin/bash\n'
                'printf "%s\\n" "$GIT_TERMINAL_PROMPT" "$GIT_HTTP_LOW_SPEED_LIMIT" '
                '"$GIT_HTTP_LOW_SPEED_TIME" "$GIT_SSH_COMMAND" > "$PROBE"\n'
                'exit 128\n'
            )
            git.chmod(0o755)
            notify = root / "bin/osascript"
            notify.write_text('#!/bin/bash\nexit 0\n')
            notify.chmod(0o755)
            env = dict(os.environ, PATH=f'{root / "bin"}:/usr/bin:/bin', PROBE=str(root / "probe"))
            result = subprocess.run(["bash", str(root / "scripts/daily_publish.sh")], env=env, timeout=10)
            self.assertEqual(result.returncode, 1)
            self.assertIn("FAILED: git fetch failed", (root / "scripts/daily_publish.log").read_text())
            prompt, limit, seconds, ssh = (root / "probe").read_text().splitlines()
            self.assertEqual(prompt, "0", "scheduled Git must never wait for an interactive login")
            self.assertGreater(int(limit), 0)
            self.assertLessEqual(int(seconds), 60)
            self.assertIn("ConnectTimeout=15", ssh)
            self.assertIn("BatchMode=yes", ssh)


if __name__ == "__main__":
    unittest.main()
