#!/usr/bin/env bash
# Kullanım: tools/probe.sh <sayfa.html[?query]> [genişlik=390]
# Sayfanın geçici kopyasına ölçüm betiği enjekte eder ve JSON rapor basar:
# JS hataları, yatay taşma (viewport dışına çıkan elemanlar), alt'sız img, kırık img, h1 sayısı, title/meta.
# 500px altı genişlikler iframe sarmalayıcı ile ölçülür (Chrome minimum pencere sınırı).
set -euo pipefail
PAGE="$1"; W="${2:-390}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="${PAGE%%\?*}"; QUERY=""; if [[ "$PAGE" == *\?* ]]; then QUERY="?${PAGE#*\?}"; fi
TMP="$ROOT/.probe-$$-$(basename "$FILE")"
python3 - "$ROOT/$FILE" "$TMP" <<'PY'
import sys, re
src, dst = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
inject = r'''<script>
(function(){window.__probe={errors:[],warnings:[]};
var oe=console.error.bind(console);console.error=function(){window.__probe.errors.push([].slice.call(arguments).join(' '));oe.apply(console,arguments)};
var ow=console.warn.bind(console);console.warn=function(){window.__probe.warnings.push([].slice.call(arguments).join(' '));ow.apply(console,arguments)};
window.addEventListener('error',function(e){window.__probe.errors.push((e.message||'')+' @'+(e.filename||'').split('/').pop()+':'+(e.lineno||''))});
window.addEventListener('unhandledrejection',function(e){window.__probe.errors.push('unhandledrejection: '+(e.reason&&e.reason.message||e.reason))});
window.addEventListener('load',function(){setTimeout(function(){
 var de=document.documentElement, vw=de.clientWidth, wide=[];
 document.querySelectorAll('body *').forEach(function(el){
   if(el.id==='__probe_report')return;
   var r=el.getBoundingClientRect(); if(r.width<=0)return;
   var cs=getComputedStyle(el); if(cs.position==='fixed'||cs.visibility==='hidden'||cs.display==='none')return;
   var p=el.parentElement, clipped=false; while(p&&p!==document.body){var pcs=getComputedStyle(p); if(/hidden|clip|auto|scroll/.test(pcs.overflowX)){clipped=true;break;} p=p.parentElement;}
   if(clipped)return;
   if(r.right>vw+1||r.left<-1){var c=(typeof el.className==='string'&&el.className.trim())?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';
     wide.push(el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+c+' ['+Math.round(r.left)+'→'+Math.round(r.right)+']');}
 });
 var rep={viewport:vw,scrollWidth:de.scrollWidth,overflowX:de.scrollWidth>vw+1,wideCount:wide.length,wideElements:wide.slice(0,12),
  h1Count:document.querySelectorAll('h1').length,
  imgNoAlt:[].filter.call(document.images,function(i){return !i.hasAttribute('alt')}).length,
  brokenImgs:[].filter.call(document.images,function(i){return i.complete&&i.naturalWidth===0&&!/^data:/.test(i.src)}).map(function(i){return i.src.slice(0,90)}).slice(0,10),
  title:document.title,metaDesc:(document.querySelector('meta[name=description]')||{}).content||null,
  mainId:!!document.getElementById('icerik'),
  errors:window.__probe.errors,warnings:window.__probe.warnings,
  textSample:(document.body.innerText||'').replace(/\s+/g,' ').slice(0,160)};
 var s=JSON.stringify(rep);
 if(window.parent&&window.parent!==window){window.parent.postMessage({__probe:s},'*');}
 else{var pre=document.createElement('pre');pre.id='__probe_report';pre.textContent=s;document.body.appendChild(pre);}
},1500)});})();
</script>'''
m = re.search(r'<head[^>]*>', html)
html = html[:m.end()] + inject + html[m.end():] if m else inject + html
open(dst, 'w', encoding='utf-8').write(html)
PY
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TARGET="file://$TMP$QUERY"; WRAP=""
if [ "$W" -lt 500 ]; then
  WRAP="$ROOT/.probe-wrap-$$.html"
  cat > "$WRAP" <<HTML
<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}iframe{display:block;width:${W}px;height:2000px;border:0}</style>
<script>window.addEventListener('message',function(e){if(e.data&&e.data.__probe){var pre=document.createElement('pre');pre.id='__probe_report';pre.textContent=e.data.__probe;document.body.appendChild(pre);}});</script>
</head><body><iframe src="$TARGET"></iframe></body></html>
HTML
  TARGET="file://$WRAP"; W=500
fi
"$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --window-size="${W},2200" \
  --virtual-time-budget=20000 --dump-dom "$TARGET" 2>/dev/null | python3 -c "
import sys, re, html, json
d = sys.stdin.read()
m = re.search(r'<pre id=\"__probe_report\">(.*?)</pre>', d, re.S)
if m:
    print(json.dumps(json.loads(html.unescape(m.group(1))), ensure_ascii=False, indent=1))
else:
    print(json.dumps({'error': 'rapor bulunamadı (sayfa yüklenmedi veya load tetiklenmedi)'}, ensure_ascii=False))
"
rm -f "$TMP" ${WRAP:+"$WRAP"}
