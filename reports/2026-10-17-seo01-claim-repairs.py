"""One-off: repair the two recurring false claims across the guides.

1. "via/through the Gmail API" — the packaged extension has no API, no OAuth and
   no network code; it walks Gmail's rendered DOM. (docs/CHROME_WEB_STORE.md,
   content.js)
2. "no 50-per-page limit / no timeouts / in one click" — senders are chunked 20
   per query and each chunk is a sequential Gmail navigation. (parsing.js)

Exact phrase pairs, so surrounding sentences stay grammatical. Re-run is a
no-op once applied.
"""
import glob
import sys

BATCH = "in batches of up to 20 senders at a time"

PAIRS = [
    # 1. The extension does not use the Gmail API.
    ("through the Gmail API", "from inside Gmail"),
    ("via the Gmail API", "from inside Gmail"),
    ("It connects from inside Gmail, scans the entire mailbox rather than the 50 rows on screen",
     "It runs inside your Gmail tab and scans all five categories, not just the 50 rows on screen"),
    ("It connects from inside Gmail, scans your entire mailbox rather than the 50 emails on screen",
     "It runs inside your Gmail tab and scans all five categories, not just the 50 emails on screen"),
    ("Inbox Cleaner scans your inbox from inside Gmail directly, so it isn't limited by what's rendered on screen:",
     "Inbox Cleaner scans all five Gmail categories, not just what's rendered on screen:"),
    ("Inbox Cleaner reads your mailbox from inside Gmail, so it isn't bound by what's drawn on a page:",
     "Inbox Cleaner scans all five Gmail categories, not just what's drawn on a page:"),
    ("Inbox Cleaner scans your entire inbox from inside Gmail directly — it isn't limited to what's rendered in a browser tab, so it doesn't hit the same timeout wall:",
     "Inbox Cleaner scans all five Gmail categories — it isn't limited to what's rendered in one browser tab, so it avoids the same timeout wall:"),
    ("Yes. Tools that connect from inside Gmail, like Inbox Cleaner, can identify and queue thousands of emails for deletion without rendering each page in the browser, which is what causes Gmail's own interface to slow down.",
     "Yes. Tools that work inside Gmail, like Inbox Cleaner, can identify thousands of emails by sender without rendering and paging through the browser interface, which is what causes Gmail's own interface to slow down."),

    # 2. Batching, not a bypass.
    ("One click moves all their emails to Trash, whether that's 40 emails or 40,000. There's no 50-per-page limit and no guessing which senders matter.",
     f"Confirm the selection and their mail goes to Trash {BATCH} — whether that's 40 emails or 40,000 — with no guessing which senders matter."),
    ("and clears them in one click, without Gmail's 50-per-page selection limit.",
     f"and clears them {BATCH}, without retyping a search for each one."),
    ("clears every Amazon sender in one click.", f"clears every Amazon sender, {BATCH}."),
    ("clears every PayPal sender in one click.", f"clears every PayPal sender, {BATCH}."),
    ("clears every delivery sender in one click.", f"clears every delivery sender, {BATCH}."),
    ("All their emails go at once, no 50-per-page limit.", f"Their mail is cleared {BATCH}, without retyping a search per sender."),
    ("All their emails go at once, with no 50-per-page limit.", f"Their mail is cleared {BATCH}, without retyping a search per sender."),
    ("Everything from those senders goes at once, with no 50-per-page limit.", f"Their mail is cleared {BATCH}, without retyping a search per sender."),
    ("Everything from those senders goes at once, with no per-page limit.", f"Their mail is cleared {BATCH}, without retyping a search per sender."),
    ("No 50-per-page limit, and everything stays recoverable for 30 days.", "No retyping a search per sender, and everything stays recoverable for 30 days."),
    ("There's no 50-per-page limit. Everything goes to Trash", "You pick senders from a list instead of searching one at a time. Everything goes to Trash"),
    ("Every email from those senders goes at once, with no 50-per-page ceiling and no select-all timeout.", f"Their mail is cleared {BATCH}."),
    ("Every email from those senders goes at once, with no per-page limit and no timeouts.", f"Their mail is cleared {BATCH}."),
    ("Every email from those senders moves at once, with no 50-per-page cap and no timeouts.", f"Their mail is cleared {BATCH}."),
    ("Every email from those senders moves at once, with no per-page limit, and stays recoverable for 30 days.", f"Their mail is cleared {BATCH}, and stays recoverable for 30 days."),
    ("Every email from every selected sender moves at once — no per-page limit, no repeated clicking.", f"Their mail is cleared {BATCH}, without retyping a search per sender."),
    ("ranks senders by email count so you can trash every newsletter sender in one click.", f"ranks senders by email count so you can trash every newsletter sender {BATCH}."),
    ("ranks senders by volume so you can clear the biggest sources in one click.", f"ranks senders by volume so you can clear the biggest sources {BATCH}."),
    ("ranks senders by volume so you can clear the biggest sources of old mail in one click.", f"ranks senders by volume so you can clear the biggest sources of old mail {BATCH}."),
    ("ranks every sender by email count and moves all of a sender's mail to Trash in one click, with no 50-per-page limit.",
     f"ranks every sender by email count, and moves a sender's mail to Trash {BATCH}."),
    ("moves an entire sender's mail to Trash in one click with no 50-per-page ceiling.", f"moves an entire sender's mail to Trash {BATCH}."),
    ("clears it in one click with no page-by-page limit.", f"clears it {BATCH}."),
    ("clears entire senders in one click with no per-page limit.", f"clears entire senders {BATCH}."),
    ("clears thousands of emails from a sender in one click.", f"clears a sender's backlog {BATCH}."),
    ("bulk-deletes by sender in one click.", f"bulk-deletes by sender, {BATCH}."),
    ("All of them clear at once, in a single action.", f"They're cleared {BATCH}."),
    ("and click Move to Trash to clear all of their emails in a single action.", f"and click Move to Trash to clear their mail {BATCH}."),
    ("No practical limit. You can check as many senders as you want in the ranked list before clicking Move to Trash — the tool processes them all in one pass from inside Gmail.",
     f"You can check as many senders as you want before clicking Move to Trash — the tool works through them {BATCH}, so a large selection takes proportionally longer."),
    ("lets you select and Trash all of them in a single action — no per-page limit, no partial runs.",
     f"lets you select and Trash them {BATCH}, and reports any batch it cannot verify afterwards."),
    ("and lets you move everything from the senders you pick to Trash in one click.", f"and lets you move everything from the senders you pick to Trash {BATCH}."),
    (", and trashes them in one click.", f", and trashes them {BATCH}."),
    (", and all of their emails go at once, with no page limit and no timeouts. It's a Sweep for Gmail with the missing ranked-sender view added.",
     f", and clears them {BATCH}. It's a Sweep for Gmail with the missing ranked-sender view added."),
    ("select any sender from the ranked list to move all of their emails to Trash in one click. Gmail's own interface caps bulk selection at 50 emails per page, so this is the fastest way past that limit.",
     "select senders from the ranked list to move their mail to Trash. You pick from a ranked list instead of running a separate search per sender, and the extension clears them in batches of up to 20 at a time."),
    ("and lets you delete by sender instead, with no page or timeout limit.", f"and lets you delete by sender instead, {BATCH}."),
    ("deletes by sender instead with no timeout.", f"deletes by sender instead, {BATCH}."),
    ("confirm, and all their emails move to Trash.", f"confirm, and their mail moves to Trash {BATCH}."),
    ("You check the senders you don't need and move all their mail to Trash at once.", f"You check the senders you don't need and move their mail to Trash {BATCH}."),
    ("You tick the boxes and clear them in one go.", f"You tick the boxes and clear them {BATCH}."),
    ("click to clear all of their emails in a single action", f"click to clear their mail {BATCH}"),
    ("ranks every sender by email count and lets you tick the ones you want gone.", "ranks every sender by email count so you can tick the ones you want gone."),
    ("or use a tool that handles the whole thing at once.", "or use a tool that finds the senders for you."),

    # 3. Titles, descriptions and openers.
    ("including the manual method and the faster bulk-delete tool that does it in one click.",
     "including the manual method and a sender-ranked Chrome extension."),
    ("Gmail's built-in search method, and a faster tool that does it in one click.",
     "Gmail's built-in search method, and a faster Chrome extension that finds the sender for you."),
    ("but deleting them all still hits the 50-per-page limit. Here's the fastest way to clear the whole Promotions tab.",
     "but clearing a tab that built up over years takes repeated passes. Here's how to clear the whole Promotions tab."),
    ("Here's how to clear years of newsletters without the 50-per-page grind.",
     "Here's how to clear years of newsletters without repeating the same pass dozens of times."),
    ("Here are the searches to run, the order to run them in, and how to get past the 50-per-page cap.",
     "Here are the searches to run, the order to run them in, and how to avoid repeating the same pass over and over."),
    ("clear years of backlog in one click with a sender-ranked tool.",
     "clear years of backlog with a sender-ranked tool."),
    ("before you hit the 50-per-page wall repeatedly:", "before you repeat the same pass over and over:"),
]


def main() -> int:
    changed = {}
    for path in sorted(glob.glob("docs/blog/*.html")):
        src = open(path).read()
        out = src
        for old, new in PAIRS:
            out = out.replace(old, new)
        if out != src:
            open(path, "w").write(out)
            changed[path] = sum(src.count(o) for o, _ in PAIRS if o in src)
    for path, n in changed.items():
        print(f"{n:3d}  {path}")
    print(f"{len(changed)} files changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())