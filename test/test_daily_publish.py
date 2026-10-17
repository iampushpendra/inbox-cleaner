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

class QueueReadinessTest(unittest.TestCase):
    def test_empty_queue_and_unready_topic_select_drafting_without_publishing(self):
        import json, sys
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
        from publish_blog import load_queue
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root/'scripts').mkdir()
            queue=root/'scripts/blog-topics.json'
            queue.write_text('[]')
            self.assertIsNone(load_queue(queue))
            queue.write_text(json.dumps([{'slug':'first','status':'pending'},{'slug':'later','status':'pending'}]))
            self.assertEqual(load_queue(queue)['action'],'draft')
            self.assertEqual(load_queue(queue)['slug'],'first')
            drafts = root/'internal/blog-drafts'; drafts.mkdir(parents=True)
            (drafts/'first.html').write_text('draft')
            (drafts/'first.evidence.json').write_text('{"state":"draft"}')
            self.assertEqual(load_queue(queue)['slug'], 'later')
            (drafts/'later.html').write_text('draft')
            self.assertEqual(load_queue(queue)['action'], 'review')
            self.assertEqual(json.loads(queue.read_text())[0]['status'], 'pending')
            self.assertFalse((root/'scripts/content-records.json').exists(), 'draft selection must not edit tracked evidence')


    def test_unknown_slug_cannot_publish_an_existing_file(self):
        source=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root/'scripts').mkdir(); (root/'docs/blog').mkdir(parents=True)
            for name in ('publish_blog.py','content_gate.py'):
                shutil.copy(source/'scripts'/name,root/'scripts'/name)
            (root/'scripts/blog-topics.json').write_text('[]')
            (root/'docs/blog/unknown.html').write_text('<h1>Unknown</h1>')
            result=subprocess.run(['python3',str(root/'scripts/publish_blog.py'),'unknown'],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('known pending',result.stdout)
