#!/usr/bin/env python3
"""Kök dizindeki *.html dosyalarında <!-- @header --> ... <!-- @/header --> ve
<!-- @footer --> ... <!-- @/footer --> bloklarını partials/ klasöründeki kanonik
içerikle değiştirir. Blok yoksa dosyaya dokunmaz ve uyarı verir.

Kullanım:  python3 tools/sync_partials.py [--check]
  --check  : değişiklik yapmaz, farklı olan dosyaları listeler ve 1 ile çıkar
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = {
    "header": (ROOT / "partials" / "header.html").read_text(encoding="utf-8").strip() + "\n",
    "footer": (ROOT / "partials" / "footer.html").read_text(encoding="utf-8").strip() + "\n",
}


def block_re(name):
    return re.compile(r"<!-- @%s -->.*?<!-- @/%s -->\n?" % (name, name), re.S)


def main():
    check = "--check" in sys.argv
    changed, missing = [], []
    for page in sorted(ROOT.glob("*.html")):
        text = page.read_text(encoding="utf-8")
        new = text
        for name, canon in PARTIALS.items():
            rx = block_re(name)
            if not rx.search(new):
                missing.append("%s: @%s bloğu yok" % (page.name, name))
                continue
            new = rx.sub(lambda _m, c=canon: c, new, count=1)
        if new != text:
            changed.append(page.name)
            if not check:
                page.write_text(new, encoding="utf-8")
    for m in missing:
        print("UYARI:", m)
    if changed:
        print(("Farklı" if check else "Güncellendi") + ":", ", ".join(changed))
    else:
        print("Tüm sayfalar partial'larla eşleşiyor.")
    return 1 if (check and changed) or missing else 0


if __name__ == "__main__":
    sys.exit(main())
