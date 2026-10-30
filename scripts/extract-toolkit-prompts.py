#!/usr/bin/env python3
"""Build lib/toolkit/library.json from the prompt-pack PDFs.

The packs are sold as PDFs; Toolkit Live runs the same prompts as a tool.
Extracting them (rather than retyping) keeps the two identical. Re-run after
a PDF changes:  pip install pypdf && python3 scripts/extract-toolkit-prompts.py
"""
import json, re, sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
PACKS = [
    ("realtor", "Real estate", "the-realtor-ai-toolkit.pdf"),
    ("finance", "Finance professionals", "the-finance-professionals-ai-toolkit.pdf"),
    ("nonprofit", "Nonprofits", "the-nonprofit-ai-toolkit.pdf"),
    ("agency", "Marketing agencies", "the-agency-ai-toolkit.pdf"),
    ("restaurant", "Restaurants", "the-restaurant-ai-toolkit.pdf"),
]
LIG = {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl", "’": "'", "‘": "'", "“": '"', "”": '"'}

def clean(t):
    for k, v in LIG.items():
        t = t.replace(k, v)
    # Running page header: "T I B LO G I C S7The Realtor AI Toolkit"
    t = re.sub(r"T I B ?LO G I C S ?\d+[^\n]*\n", "\n", t)
    t = re.sub(r"U S E\s+T H I S\s+W H E N\s*:", "\n@@USE@@", t)
    t = re.sub(r"T H E\s+P ?R ?O ?M ?P ?T\s*:", "\n@@PROMPT@@", t)
    t = re.sub(r"P ?R ?O\s+T ?I ?P\s*:", "\n@@TIP@@", t)
    # The other packs use plain labels.
    t = re.sub(r"(?mi)^Use this when:", "@@USE@@", t)
    t = re.sub(r"(?mi)^The prompt:", "@@PROMPT@@", t)
    t = re.sub(r"(?mi)^Pro tip:", "@@TIP@@", t)
    # Bare page numbers and empty bullets left by the page layout.
    t = re.sub(r"(?m)^\s*(\d{1,3}|•)\s*$", "", t)
    return t

def para(s):
    s = re.sub(r"-\n(?=[a-z])", "", s.strip())
    return re.sub(r"\s*\n\s*", " ", s).strip()

# Packs whose category headings do not survive text extraction (they are laid
# out as a table). Taken from each PDF's Category Index: (first prompt, name).
CATEGORY_RANGES = {
    "nonprofit": [
        (1, "Donor Communication & Stewardship"), (10, "Grant Writing & Fundraising Proposals"),
        (19, "Social Media & Content Marketing"), (28, "Email Campaigns & Newsletters"),
        (37, "Volunteer Recruitment & Management"), (46, "Board & Stakeholder Communication"),
        (55, "Program Design & Impact Reporting"), (64, "Event Planning & Promotion"),
        (73, "Difficult Conversations & Crisis Comms"), (82, "Bonus: Power Prompts"),
    ],
    "agency": [
        (1, "Client Communication & Account Management"), (10, "New Business & Pitching"),
        (19, "Ad Copy & Creative Production"), (28, "Social Media & Content Marketing"),
        (37, "Strategy & Campaign Planning"), (46, "Research & Competitive Analysis"),
        (55, "Reporting & Performance Analysis"), (64, "Difficult Conversations & Objection Handling"),
        (73, "Operations, SOPs & Admin"), (82, "Agency-Specific & Specialized Tasks"),
        (91, "Bonus: Power Prompts"),
    ],
}

def toc_ranges(text):
    """Realtor-style TOC: a heading (possibly wrapped) followed by '(Prompts #a to #b)'."""
    out = []
    for m in re.finditer(r"\(Prompts #(\d+) to #\d+\)", text):
        before = text[: m.start()].rstrip().split("\n")
        # One line, or two when the heading wrapped (the first then ends in "&" or ",").
        name = before[-1].strip()
        if len(before) > 1 and re.search(r"[&,]$", before[-2].strip()):
            name = before[-2].strip() + " " + name
        name = re.sub(r"^Category \d+:\s*", "", name)
        out.append((int(m.group(1)), name))
    # Finance-style TOC: "Category 1: Client Emails (#1–#12)" on one line.
    for m in re.finditer(r"(?m)^(?:Category \d+:\s*)?([A-Z][^\n(]{3,80}?)\s*\(#(\d+)\s*[–-]\s*#?\d+\)", text):
        out.append((int(m.group(2)), m.group(1).strip()))
    # One name per starting number; the first (TOC) occurrence wins.
    seen = {}
    for start, name in out:
        seen.setdefault(start, name)
    return sorted(seen.items())

def parse(vertical, label, path):
    text = clean("\n".join(p.extract_text() or "" for p in PdfReader(path).pages))
    out, category = [], None
    ranges = CATEGORY_RANGES.get(vertical) or toc_ranges(text)

    def category_for(num, fallback):
        name = None
        for start, n in ranges:
            if num >= start:
                name = n
        return name or fallback or "General"

    # Split on category and prompt headings, keeping them.
    tokens = re.split(
        r"(?m)^(Category \d+:[^\n]*|[A-Z][^\n#]{2,80}\((?:Prompts? )?#\d+\s*[–-]\s*#?\d+\)|(?:Power )?Prompt #\d+\s*[—–.:-][^\n]*)\s*$",
        text,
    )
    for i in range(1, len(tokens), 2):
        head, body = tokens[i].strip(), tokens[i + 1]
        if not re.match(r"(?:Power )?Prompt #", head):
            category = re.sub(r"^Category \d+:\s*", "", head)
            category = re.sub(r"\s*\((?:Prompts? )?#\d+\s*[–-]\s*#?\d+\)\s*$", "", category).strip()
            continue
        m = re.match(r"(?:Power )?Prompt #(\d+)\s*[—–.:-]\s*(.*)", head)
        num, title = int(m.group(1)), m.group(2).strip()
        # A long title wraps; its second line sits before "Use this when".
        pre = body.split("@@USE@@", 1)[0].strip()
        if pre and "@@" not in pre and len(pre) < 80 and "\n" not in pre:
            # "First-" + "Time Buyers" keeps its hyphen; "sea-" + "son" does not.
            joiner = "" if title.endswith("-") and pre[:1].isupper() else (" " if not title.endswith("-") else "")
            title = (title if pre[:1].isupper() else title.rstrip("-")) + joiner + pre
        use = re.search(r"@@USE@@(.*?)@@PROMPT@@", body, re.S)
        prm = re.search(r"@@PROMPT@@(.*?)(@@TIP@@|$)", body, re.S)
        tip = re.search(r"@@TIP@@(.*)", body, re.S)
        if not (use and prm):
            continue
        tip_text = para(tip.group(1)) if tip else ""
        # A tip runs to the next heading; drop a trailing section title that the
        # page layout glued on (e.g. a bonus-section banner).
        tip_text = re.split(r"\s(?:Bonus|BONUS|Cheat Sheet|Prompt-Writing|Category \d+)", tip_text)[0].strip()
        prompt = para(prm.group(1))
        fields = []
        for f in re.findall(r"\[([^\]]{2,60})\]", prompt):
            if f not in fields:
                fields.append(f)
        out.append({
            "id": f"{vertical}-{num}",
            "vertical": vertical,
            "number": num,
            "category": category_for(num, category),
            "title": title,
            "useWhen": para(use.group(1)),
            "prompt": prompt,
            "proTip": tip_text,
            "fields": fields,
        })
    return out

library = {"verticals": [], "prompts": []}
for vertical, label, fname in PACKS:
    items = parse(vertical, label, ROOT / "private" / "downloads" / fname)
    library["verticals"].append({"id": vertical, "label": label, "count": len(items)})
    library["prompts"].extend(items)
    print(f"{vertical:11s} {len(items):4d} prompts, {len({p['category'] for p in items})} categories", file=sys.stderr)

for p in library["prompts"]:
    p["category"] = re.sub(r"^Bonus: \d+ ", "Bonus: ", p["category"])
(ROOT / "lib" / "toolkit" / "library.json").write_text(json.dumps(library, ensure_ascii=False, separators=(",", ":")))
