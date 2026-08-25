(function () { “use strict”;

const VERSION = “6.0”; const SHIFT_CODES = [““,”A”, “B”, “C1”, “D”, “E”,
“H”, “週”, “振”, “出”, “勤”, “休”];

const pad = n => String(n).padStart(2, “0”); const dateKey = (y, m, d)
=> ${y}-${pad(m)}-${pad(d)}; const daysInMonth = (y, m) => new Date(y,
m, 0).getDate(); const clean = s => String(s ||
““).replace(//g,”“).trim();

function monthInfo() { const el = document.getElementById(“month”);
const m = el && el.textContent.match(/()年()月/); if (m) return { year:
Number(m[1]), month: Number(m[2]) }; const d = new Date(); return {
year: d.getFullYear(), month: d.getMonth() + 1 }; }

function loadData() { try { return
JSON.parse(localStorage.getItem(“monthlyTodo”)) || {}; } catch (e) {
return {}; } }

function saveShifts(shifts) { const data = loadData(); data.shifts =
shifts; localStorage.setItem(“monthlyTodo”, JSON.stringify(data)); }

function loadImage(file) { return new Promise((resolve, reject) => {
const img = new Image(); const url = URL.createObjectURL(file);
img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
img.onerror = reject; img.src = url; }); }

function loadOCR() { return new Promise((resolve, reject) => { if
(window.Tesseract) return resolve(); const s =
document.createElement(“script”); s.src =
“https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js”;
s.onload = resolve; s.onerror = () => reject(new
Error(“OCRエンジンを読み込めませんでした”));
document.head.appendChild(s); }); }

function makeButton() { let button =
document.getElementById(“shiftImportButton”); if (!button) { button =
document.createElement(“button”); button.id = “shiftImportButton”;
button.textContent = “📷 シフト表を読み込む”; button.style.cssText =
“display:block;width:100%;margin:10px 0;padding:14px;border:1px solid
#d0c8be;border-radius:10px;background:#fffefa;color:#403b36;font-size:16px;font-weight:700;box-sizing:border-box;”;
const app = document.querySelector(“.app”); const calendar =
document.querySelector(“.calendar”); if (app && calendar)
app.insertBefore(button, calendar); else
document.body.appendChild(button); } if (button.dataset.version ===
VERSION) return; button.dataset.version = VERSION;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    button.onclick = () => input.click();
    input.onchange = async () => {
      if (!input.files[0]) return;
      button.disabled = true;
      button.textContent = "📖 読み込み準備中…";
      try {
        const setting = await settingDialog(monthInfo());
        if (setting) await rowDialog(input.files[0], setting, button);
      } catch (e) {
        console.error(e);
        alert("シフト表を読み込めませんでした。\n\n" + e.message);
      } finally {
        button.disabled = false;
        button.textContent = "📷 シフト表を読み込む";
        input.value = "";
      }
    };

}

function settingDialog(m) { return new Promise(resolve => { const bg =
document.createElement(“div”); bg.style.cssText =
“position:fixed;inset:0;z-index:9999;background:#0006;display:flex;align-items:center;justify-content:center;padding:15px;”;
const box = document.createElement(“div”); box.style.cssText =
“background:#fffefa;width:min(430px,100%);border-radius:15px;padding:20px;”;
box.innerHTML =
<h2 style="margin:0 0 14px">シフト表を読み込む</h2>         <p style="font-size:13px;color:#777;line-height:1.6">写真を選んだあと、<br>自分の行（久山さんの行）をタップします。</p>         <div style="display:flex;gap:8px">           <input id="siYear" type="number" value="${m.year}" style="width:50%;height:44px;font-size:16px;border:1px solid #d0c8be;border-radius:8px">           <input id="siMonth" type="number" value="${m.month}" min="1" max="12" style="width:50%;height:44px;font-size:16px;border:1px solid #d0c8be;border-radius:8px">         </div>         <div style="margin-top:14px;padding:10px;background:#f4f1eb;border-radius:8px;font-size:12px">今回は <strong>${m.year}年${m.month}月</strong> のシフト表です。</div>         <div style="display:flex;gap:8px;margin-top:15px">           <button id="sic" style="flex:1;min-height:42px;border:1px solid #d0c8be;background:white;border-radius:8px">キャンセル</button>           <button id="sio" style="flex:1;min-height:42px;border:0;background:#626960;color:white;border-radius:8px">写真を選ぶ</button>         </div>;
bg.appendChild(box); document.body.appendChild(bg);
box.querySelector(“#sic”).onclick = () => { bg.remove(); resolve(null);
}; box.querySelector(“#sio”).onclick = () => { const year =
Number(box.querySelector(“#siYear”).value); const month =
Number(box.querySelector(“#siMonth”).value); if (!year || month < 1 ||
month > 12) return alert(“年月を確認してください。”); bg.remove();
resolve({ year, month }); }; }); }

async function rowDialog(file, setting, button) { const img = await
loadImage(file); return new Promise(resolve => { const bg =
document.createElement(“div”); bg.style.cssText =
“position:fixed;inset:0;z-index:9999;background:#0008;display:flex;align-items:center;justify-content:center;padding:10px;”;
const box = document.createElement(“div”); box.style.cssText =
“width:min(760px,100%);max-height:95vh;overflow:auto;background:#fffefa;border-radius:15px;padding:15px;”;
box.innerHTML =
<h2 style="margin:0 0 8px">自分の行をタップ</h2>         <p style="font-size:13px;color:#777;line-height:1.6">「久山」さんの水色の行の中央あたりをタップしてください。<br>今回は、選んだ行を30日分のマスに分けて読み取ります。</p>         <div id="photoBox" style="position:relative;width:100%;overflow:auto;background:#eee;border-radius:8px">           <img id="shiftPhoto" style="display:block;width:100%;height:auto">           <div id="guide" style="display:none;position:absolute;left:0;right:0;height:5px;background:#e45b5b;pointer-events:none"></div>         </div>         <p style="font-size:12px;color:#777;margin:9px 0">赤い線が選択した行です。</p>         <div style="display:flex;gap:8px">           <button id="rc" style="flex:1;min-height:42px;border:1px solid #d0c8be;background:white;border-radius:8px">キャンセル</button>           <button id="rr" disabled style="flex:1;min-height:42px;border:0;background:#626960;color:white;border-radius:8px;opacity:.45">この行を読み取る</button>         </div>;
bg.appendChild(box); document.body.appendChild(bg);

      const photo = box.querySelector("#shiftPhoto");
      const guide = box.querySelector("#guide");
      const read = box.querySelector("#rr");
      photo.src = URL.createObjectURL(file);
      let y = null;

      photo.onclick = e => {
        const r = photo.getBoundingClientRect();
        y = (e.clientY - r.top) * (img.naturalHeight / r.height);
        guide.style.display = "block";
        guide.style.top = (y / img.naturalHeight * 100) + "%";
        read.disabled = false; read.style.opacity = "1";
      };

      box.querySelector("#rc").onclick = () => { bg.remove(); resolve(); };
      read.onclick = async () => {
        if (y == null) return;
        read.disabled = true; read.textContent = "📖 読み取っています…";
        try {
          const result = await readRow(img, y, setting.year, setting.month, button);
          bg.remove();
          showResult(result, setting.year, setting.month);
        } catch (e) {
          console.error(e);
          alert("読み取りに失敗しました。\n\n" + e.message);
          read.disabled = false; read.textContent = "この行を読み取る";
        }
        resolve();
      };
    });

}

function findVerticalGrid(source) { const ctx = source.getContext(“2d”,
{ willReadFrequently: true }); const hh = Math.min(source.height,
Math.round(source.height * 0.22)); const data = ctx.getImageData(0, 0,
source.width, hh).data; const score = new Array(source.width).fill(0);
for (let x = 0; x < source.width; x++) { let n = 0; for (let y = 5; y <
hh; y += 2) { const p = (y * source.width + x) * 4; const g = (data[p] *
0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114); if (g < 150) n++; }
score[x] = n; } const threshold = Math.max(18, Math.round(hh * 0.28 /
2)); const peaks = []; for (let x = 1; x < source.width - 1; x++) { if
(score[x] >= threshold && score[x] >= score[x - 1] && score[x] >=
score[x + 1]) peaks.push(x); } const centers = []; for (const x of
peaks) { if (!centers.length || x - centers[centers.length - 1] > 5)
centers.push(x); else centers[centers.length - 1] =
Math.round((centers[centers.length - 1] + x) / 2); } let best = null;
for (let i = 0; i < centers.length; i++) { for (let j = i + 30; j <
Math.min(centers.length, i + 36); j++) { const a = centers.slice(i, j +
1); if (a.length < 31) continue; const gaps = a.slice(1).map((v,k) =>
v - a[k]); const med =
gaps.slice().sort((p,q)=>p-q)[Math.floor(gaps.length/2)]; const ok =
gaps.filter(g => g >= med * 0.72 && g <= med * 1.28).length; if (med >=
25 && med <= 60 && ok >= gaps.length - 2) { const cand = { a, med }; if
(!best || cand.a.length > best.a.length) best = cand; } } } if (!best)
return null; // The table has one spare column after day 30; use the
first 31 boundaries. return best.a.slice(0, 31); }

function findHorizontalBounds(source, rowY) { const ctx =
source.getContext(“2d”, { willReadFrequently: true }); const w =
source.width; const y0 = Math.max(0, Math.round(rowY - 90)); const y1 =
Math.min(source.height - 1, Math.round(rowY + 90)); const data =
ctx.getImageData(0, y0, w, y1 - y0 + 1).data; const scores = []; for
(let y = 0; y <= y1 - y0; y++) { let n = 0; for (let x = Math.round(w *
0.07); x < Math.round(w * 0.92); x += 3) { const p = (y * w + x) * 4;
const g = data[p] * 0.299 + data[p+1] * 0.587 + data[p+2] * 0.114; if (g
< 120) n++; } scores.push(n); } const peaks = []; for (let i = 1; i <
scores.length - 1; i++) { if (scores[i] > scores[i-1] && scores[i] >=
scores[i+1] && scores[i] > w * 0.18) peaks.push(y0 + i); } let above =
null, below = null; for (const y of peaks) { if (y < rowY) above = y; if
(y > rowY && below == null) below = y; } if (above == null) above =
Math.max(0, rowY - 20); if (below == null) below =
Math.min(source.height, rowY + 20); return { top: above, bottom: below
}; }

function ocrTextFromCanvas(canvas, worker) { return
worker.recognize(canvas).then(r => clean(r.data.text)); }

function classify(parts) { const eng = parts.eng.join(““).toUpperCase();
const jpn = parts.jpn.join(”“); const all = eng + jpn;

    if (/C\s*1|G\s*1/.test(eng)) return "C1";
    if (parts.count >= 2 && /[CG]/.test(eng) && /1/.test(eng)) return "C1";
    if (/A/.test(eng)) return "A";
    if (/B/.test(eng)) return "B";
    if (/D/.test(eng)) return "D";
    if (/E/.test(eng) || /\[/.test(eng)) return "E";
    if (/H/.test(eng) || /^L+$/.test(eng) || /日/.test(jpn)) return "H";
    if (/G/.test(eng) && !/1/.test(eng)) return "C";
    if (/週|周/.test(jpn)) return "週";
    if (/振/.test(jpn)) return "振";
    if (/出/.test(jpn) || /中/.test(jpn) || (parts.count === 1 && /^(1|I|l)$/.test(eng))) return "出";
    if (/勤/.test(jpn)) return "勤";
    if (/休/.test(jpn)) return "休";
    return "";

}

async function readRow(img, rowY, year, month, button) { await
loadOCR(); const maxW = 2400; const scale = Math.min(1, maxW /
img.naturalWidth); const source = document.createElement(“canvas”);
source.width = Math.round(img.naturalWidth * scale); source.height =
Math.round(img.naturalHeight * scale);
source.getContext(“2d”).drawImage(img, 0, 0, source.width,
source.height);

    const sy = rowY * scale;
    const bounds = findVerticalGrid(source);
    if (!bounds || bounds.length < 31) throw new Error("日付のマス目を見つけられませんでした。表全体が写っている写真で試してください。");
    const hb = findHorizontalBounds(source, sy);
    const top = Math.max(0, Math.round(hb.top + 3));
    const bottom = Math.min(source.height, Math.round(hb.top + (hb.bottom - hb.top) * 0.72));

    const worker = await Tesseract.createWorker(["eng", "jpn"], 1, {
      logger: m => {
        if (m.progress != null && m.status) button.textContent = `📖 ${m.status} ${Math.round(m.progress * 100)}%`;
      }
    });

    const result = [];
    try {
      await worker.setParameters({ preserve_interword_spaces: "0" });
      const count = daysInMonth(year, month);
      for (let day = 1; day <= count; day++) {
        const x0 = bounds[day - 1];
        const x1 = bounds[day];
        const margin = Math.max(3, Math.round((x1 - x0) * 0.12));
        const sx = x0 + margin;
        const sw = Math.max(8, x1 - x0 - margin * 2);
        const sh = Math.max(10, bottom - top);
        const cell = document.createElement("canvas");
        cell.width = sw * 10;
        cell.height = sh * 10;
        const cc = cell.getContext("2d");
        cc.fillStyle = "white";
        cc.fillRect(0, 0, cell.width, cell.height);
        cc.drawImage(source, sx, top, sw, sh, 0, 0, cell.width, cell.height);

        // Threshold the cell so the cyan row and gray weekend cells do not confuse OCR.
        const id = cc.getImageData(0, 0, cell.width, cell.height);
        const pix = id.data;
        for (let i = 0; i < pix.length; i += 4) {
          const g = pix[i] * 0.299 + pix[i+1] * 0.587 + pix[i+2] * 0.114;
          const v = g < 105 ? 0 : 255;
          pix[i] = pix[i+1] = pix[i+2] = v;
        }
        cc.putImageData(id, 0, 0);

        // Remove very long border-like components by using the upper part only; the dash line is below it.
        const parts = { eng: [], jpn: [], count: 0 };
        const small = document.createElement("canvas");
        small.width = Math.max(20, Math.round(cell.width / 3));
        small.height = Math.max(20, Math.round(cell.height / 3));
        small.getContext("2d").drawImage(cell, 0, 0, small.width, small.height);

        // First try the whole glyph. This handles 週 and 出.
        for (const lang of ["eng", "jpn"]) {
          try {
            await worker.setParameters({ tessedit_pageseg_mode: "10", tessedit_char_whitelist: lang === "eng" ? "ABCDEHCD1GLI[]()" : "週周振出勤休中日" });
            const r = await worker.recognize(small);
            const t = clean(r.data.text);
            if (t) parts[lang].push(t);
          } catch (e) {}
        }

        // Detect a second component for C1 (C and 1 are separate printed marks).
        try {
          const bw = cvLikeBinary(small);
          const comps = connectedComponents(bw);
          const useful = comps.filter(c => c.area >= 20 && c.h >= 25 && c.h <= small.height * 0.95 && c.w <= small.width * 0.65).sort((a,b)=>a.x-b.x);
          if (useful.length >= 2) {
            parts.count = useful.length;
            for (const c of useful.slice(0, 3)) {
              const q = document.createElement("canvas");
              q.width = (c.w + 8) * 8; q.height = (c.h + 8) * 8;
              const qc = q.getContext("2d");
              qc.fillStyle = "white"; qc.fillRect(0,0,q.width,q.height);
              qc.drawImage(small, Math.max(0,c.x-4), Math.max(0,c.y-4), c.w+8, c.h+8, 0,0,q.width,q.height);
              const r = await worker.recognize(q);
              const t = clean(r.data.text).toUpperCase();
              if (t) parts.eng.push(t);
            }
          } else parts.count = useful.length;
        } catch (e) {}

        let shift = classify(parts);
        // Strong visual/OCR fallbacks for this sheet's printed glyphs.
        const joined = (parts.eng.join("") + parts.jpn.join(""));
        if (!shift && /週|周/.test(joined)) shift = "週";
        if (!shift && /中/.test(joined)) shift = "出";
        if (!shift && /G/.test(parts.eng.join("")) && parts.count === 2) shift = "C1";

        result.push({ day, shift, detected: !!shift, raw: joined });
        if (day % 2 === 0) await new Promise(r => setTimeout(r, 10));
      }
    } finally {
      await worker.terminate();
    }
    return result;

}

function cvLikeBinary(canvas) { const c = canvas.getContext(“2d”, {
willReadFrequently: true }); const id =
c.getImageData(0,0,canvas.width,canvas.height); const a = new
Uint8Array(canvas.width * canvas.height); for (let
y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) { const
p=(ycanvas.width+x)4; const g=id.data[p]; a[y*canvas.width+x] = g < 128
? 1 : 0; } return { w:canvas.width, h:canvas.height, a }; }

function connectedComponents(b) { const seen = new
Uint8Array(b.a.length), out=[]; for(let y=0;y<b.h;y++) for(let
x=0;x<b.w;x++) { const idx=yb.w+x; if(!b.a[idx] || seen[idx]) continue;
const q=[idx]; seen[idx]=1; let minx=x,maxx=x,miny=y,maxy=y,area=0;
for(let k=0;k<q.length;k++) { const p=q[k], py=Math.floor(p/b.w),
px=p-pyb.w; area++;
if(px<minx)minx=px;if(px>maxx)maxx=px;if(py<miny)miny=py;if(py>maxy)maxy=py;
for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const
nx=px+dx,ny=py+dy; if(nx<0||ny<0||nx>=b.w||ny>=b.h)continue; const
ni=ny*b.w+nx; if(b.a[ni]&&!seen[ni]){seen[ni]=1;q.push(ni);} } }
out.push({x:minx,y:miny,w:maxx-minx+1,h:maxy-miny+1,area}); } return
out; }

function showResult(result, year, month) { const bg =
document.createElement(“div”); bg.style.cssText =
“position:fixed;inset:0;z-index:9999;background:#0006;display:flex;align-items:center;justify-content:center;padding:15px;”;
const box = document.createElement(“div”); box.style.cssText =
“background:#fffefa;width:min(480px,100%);max-height:90vh;overflow:auto;border-radius:15px;padding:20px;”;
const detected = result.filter(x=>x.detected).length; let html=““;
result.forEach(item=>{ const
options=SHIFT_CODES.map(code=><option value="${code}" ${code===item.shift?"selected":""}>${code||"なし"}</option>).join(”“);
html +=
<div style="display:flex;gap:7px;align-items:center;margin-bottom:7px"><div style="width:50px;font-weight:600">${month}/${item.day}</div><select data-day="${item.day}" style="flex:1;height:38px;border:1px solid #d0c8be;border-radius:7px;font-size:15px;background:white">${options}</select><span style="width:28px;text-align:center;color:${item.detected?"#4b875f":"#aaa"}">${item.detected?"✓":"－"}</span></div>;
});
box.innerHTML=<h2 style="margin:0 0 8px">シフトを確認</h2><p style="font-size:13px;color:#777;line-height:1.6">自動判定された結果です。<br>間違っている日はここで修正してください。</p><div style="padding:10px;margin-bottom:10px;background:#f4f1eb;border-radius:8px;font-size:12px">📅 ${year}年${month}月<br>自動検出：<strong>${detected}日</strong> / ${result.length}日</div><div style="padding:8px;background:#faf8f3;border-radius:9px">${html}</div><div style="display:flex;gap:8px;margin-top:15px"><button id="cancelResult" style="flex:1;min-height:42px;border:1px solid #d0c8be;background:white;border-radius:8px">キャンセル</button><button id="applyResult" style="flex:1;min-height:42px;border:0;background:#626960;color:white;border-radius:8px;font-weight:600">カレンダーへ反映</button></div>;
bg.appendChild(box); document.body.appendChild(bg);
box.querySelector(”#cancelResult”).onclick=()=>bg.remove();
box.querySelector(“#applyResult”).onclick=()=>{ const
shifts=loadData().shifts||{};
box.querySelectorAll(“select[data-day]”).forEach(select=>{ const
key=dateKey(year,month,Number(select.dataset.day)); if(select.value)
shifts[key]=select.value; else delete shifts[key]; });
saveShifts(shifts); bg.remove(); location.reload(); }; }

function init(){ makeButton(); } if(document.readyState===“loading”)
document.addEventListener(“DOMContentLoaded”,init); else init(); })();
