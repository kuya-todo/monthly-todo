// Monthly Todo - シフト表画像インポート
// ボタン表示を独立させ、写真から自分の行のシフトを読み取る

(function () {
  "use strict";

  const VERSION = "3.0";
  const SHIFT_CODES = ["A", "B", "C1", "D", "E", "H", "週", "振", "出", "勤", "休"];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  function currentMonth() {
    const el = document.getElementById("month");
    const m = el && el.textContent.match(/(\d{4})年\s*(\d{1,2})月/);
    if (m) return { year: Number(m[1]), month: Number(m[2]) };

    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  }

  function normalizeText(s) {
    return String(s || "").replace(/[\s|｜]/g, "").trim();
  }

  function normalizeShift(s) {
    const x = normalizeText(s).replace(/[。、．.,]/g, "");

    if (["CI", "Cl", "CL", "c1"].includes(x)) {
      return "C1";
    }

    return SHIFT_CODES.includes(x) ? x : "";
  }

  function showMessage(title, message) {
    alert(title + "\n\n" + message);
  }

  // ==============================
  // 読み込みボタン
  // ==============================

  function addImportButton() {
    let btn = document.getElementById("shiftImportButton");

    if (btn && btn.dataset.bound === VERSION) {
      return;
    }

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "shiftImportButton";
      btn.textContent = "📷 シフト表を読み込む";

      btn.style.cssText = `
        display:block;
        width:100%;
        margin:10px 0;
        padding:14px;
        border:1px solid #d0c8be;
        border-radius:10px;
        background:#fffefa;
        color:#403b36;
        font-size:16px;
        font-weight:700;
      `;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    btn.onclick = () => input.click();

    input.onchange = async () => {
      if (!input.files || !input.files[0]) return;

      const file = input.files[0];

      btn.disabled = true;
      btn.textContent = "📖 シフト表を読み取っています…";

      try {
        if (!window.Tesseract) {
          await loadScript(
            "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"
          );
        }

        const m = currentMonth();

        const settings = await showSettings(m);

        if (!settings) {
          return;
        }

        btn.textContent = "📖 写真を解析しています…";

        const result = await readShiftImage(
          file,
          settings.name
        );

        if (!result.length) {
          showMessage(
            "シフトを見つけられませんでした",
            "指定した名前の行を確認できませんでした。\n\n" +
            "・写真全体が入っているか\n" +
            "・文字がぼやけていないか\n" +
            "・シフト表の名前が読めるか\n\n" +
            "を確認して、もう一度試してください。"
          );

          return;
        }

        showShiftResult(
          result,
          settings.year,
          settings.month
        );

      } catch (e) {
        console.error(e);

        showMessage(
          "読み取りエラー",
          "シフト表を読み取れませんでした。\n\n" +
          "もう一度写真を選んで試してください。"
        );

      } finally {
        btn.disabled = false;
        btn.textContent = "📷 シフト表を読み込む";
        input.value = "";
      }
    };

    const slot = document.getElementById("shift-import-slot");
    const app = document.querySelector(".app");
    const calendar = document.querySelector(".calendar");

    if (slot) {
      slot.innerHTML = "";
      slot.appendChild(btn);
      slot.appendChild(input);

    } else if (app && calendar) {
      app.insertBefore(btn, calendar);
      app.insertBefore(input, calendar);

    } else {
      document.body.appendChild(btn);
      document.body.appendChild(input);
    }

    btn.dataset.bound = VERSION;
  }

  // ==============================
  // 設定
  // ==============================

  function showSettings(m) {
    return new Promise(resolve => {

      const bg = document.createElement("div");

      bg.style.cssText =
        "position:fixed;inset:0;background:#0006;z-index:9999;" +
        "display:flex;align-items:center;justify-content:center;padding:15px;";

      const box = document.createElement("div");

      box.style.cssText =
        "background:#fffefa;width:min(430px,100%);" +
        "border-radius:15px;padding:20px;" +
        "box-shadow:0 12px 40px #0004;";

      box.innerHTML = `
        <h2 style="margin:0 0 15px">
          シフト表を読み込む
        </h2>

        <p style="font-size:13px;color:#777;line-height:1.6">
          写真の中から、あなたの行を探して読み取ります。
        </p>

        <label style="display:block;font-size:12px;color:#777;margin-bottom:5px">
          シフト表の名前
        </label>

        <input
          id="shiftRowName"
          type="text"
          value="久山"
          placeholder="例：久山"
          style="
            width:100%;
            height:44px;
            border:1px solid #d0c8be;
            border-radius:8px;
            padding:8px 10px;
            font-size:16px;
            box-sizing:border-box
          "
        >

        <div style="margin-top:15px">

          <label style="display:block;font-size:12px;color:#777;margin-bottom:5px">
            対象年月
          </label>

          <div style="display:flex;gap:7px">

            <input
              id="shiftYear"
              type="number"
              value="${m.year}"
              style="
                width:50%;
                height:44px;
                border:1px solid #d0c8be;
                border-radius:8px;
                padding:8px;
                font-size:16px;
                box-sizing:border-box
              "
            >

            <input
              id="shiftMonth"
              type="number"
              min="1"
              max="12"
              value="${m.month}"
              style="
                width:50%;
                height:44px;
                border:1px solid #d0c8be;
                border-radius:8px;
                padding:8px;
                font-size:16px;
                box-sizing:border-box
              "
            >

          </div>

        </div>

        <p style="
          margin:15px 0 0;
          padding:10px;
          background:#f4f1eb;
          border-radius:8px;
          font-size:12px;
          line-height:1.6
        ">
          💡 今回のシフト表なら
          「久山」、年月は「2026年9月」でOKです。
        </p>

        <div style="display:flex;gap:8px;margin-top:16px">

          <button
            id="shiftSettingCancel"
            style="
              flex:1;
              min-height:42px;
              border:1px solid #d0c8be;
              background:white;
              border-radius:8px
            "
          >
            キャンセル
          </button>

          <button
            id="shiftSettingOK"
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
              font-weight:600
            "
          >
            読み取り開始
          </button>

        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      const close = () => bg.remove();

      box.querySelector(
        "#shiftSettingCancel"
      ).onclick = () => {
        close();
        resolve(null);
      };

      box.querySelector(
        "#shiftSettingOK"
      ).onclick = () => {

        const name =
          box.querySelector("#shiftRowName").value.trim();

        const year =
          Number(
            box.querySelector("#shiftYear").value
          );

        const month =
          Number(
            box.querySelector("#shiftMonth").value
          );

        if (!name || !year || month < 1 || month > 12) {
          alert("名前と年月を確認してください。");
          return;
        }

        close();

        resolve({
          name,
          year,
          month
        });
      };
    });
  }

  // ==============================
  // 画像読み込み
  // ==============================

  function loadImage(file) {
    return new Promise((resolve, reject) => {

      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = reject;

      img.src = URL.createObjectURL(file);
    });
  }

  // ==============================
  // OCR
  // ==============================

  async function readShiftImage(file, rowName) {

    const image = await loadImage(file);

    const scale = 2;

    const canvas = document.createElement("canvas");

    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const ocr = await Tesseract.recognize(
      canvas,
      "jpn+eng",
      {
        logger: m =>
          console.log(
            "OCR",
            m.status,
            Math.round(
              (m.progress || 0) * 100
            ) + "%"
          )
      }
    );

    const words =
      ocr.data && ocr.data.words
        ? ocr.data.words
        : [];

    const lines =
      ocr.data && ocr.data.lines
        ? ocr.data.lines
        : [];

    if (!words.length) {
      return [];
    }

    const w = canvas.width;
    const h = canvas.height;

    const wanted = normalizeText(rowName);

    let rowY = null;

    // 名前が含まれる行を探す
    const line = lines.find(
      l =>
        normalizeText(l.text).includes(wanted)
    );

    if (line) {
      rowY =
        (line.bbox.y0 + line.bbox.y1) / 2;
    }

    // 行として見つからなかった場合
    // 左側30%から名前を探す
    if (rowY == null) {

      const candidates = words.filter(
        x =>
          normalizeText(x.text).includes(wanted) &&
          x.bbox.x0 < w * 0.30
      );

      if (candidates.length) {

        rowY =
          (candidates[0].bbox.y0 +
            candidates[0].bbox.y1) / 2;
      }
    }

    if (rowY == null) {
      return [];
    }

    // 名前と同じ高さにある文字だけ取得
    const rowWords = words.filter(word => {

      const y =
        (word.bbox.y0 + word.bbox.y1) / 2;

      return Math.abs(y - rowY) < h * 0.035;
    });

    // 日付の位置を取得
    let datePositions = words
      .filter(word => {

        const n =
          Number(
            normalizeText(word.text)
          );

        const y =
          (word.bbox.y0 + word.bbox.y1) / 2;

        return (
          Number.isInteger(n) &&
          n >= 1 &&
          n <= 31 &&
          y < rowY - h * 0.12 &&
          word.bbox.x0 > w * 0.04
        );
      })
      .map(word => ({
        day: Number(
          normalizeText(word.text)
        ),
        x:
          (word.bbox.x0 +
            word.bbox.x1) / 2
      }))
      .sort(
        (a, b) => a.x - b.x
      );

    const dates = [];

    datePositions.forEach(p => {

      if (
        !dates.some(
          x =>
            Math.abs(x.x - p.x) <
            w * 0.012
        )
      ) {
        dates.push(p);
      }
    });

    // 日付OCRがうまくいかなかった場合
    // 表の横幅から31日分を推定
    if (dates.length < 10) {

      dates.length = 0;

      const startX = w * 0.086;
      const endX = w * 0.935;

      const step =
        (endX - startX) / 30;

      for (let d = 1; d <= 31; d++) {

        dates.push({
          day: d,
          x:
            startX +
            step * (d - 0.5)
        });
      }

    } else {

      const pts =
        dates.filter(
          p =>
            p.day >= 1 &&
            p.day <= 31
        );

      if (pts.length >= 2) {

        const first = pts[0];
        const last =
          pts[pts.length - 1];

        const slope =
          (last.x - first.x) /
          (last.day - first.day || 1);

        const intercept =
          first.x -
          slope * first.day;

        dates.length = 0;

        for (let d = 1; d <= 31; d++) {

          dates.push({
            day: d,
            x:
              intercept +
              slope * d
          });
        }
      }
    }

    // シフト文字を日付に割り当てる
    const found = [];

    rowWords.forEach(word => {

      const shift =
        normalizeShift(word.text);

      if (!shift) return;

      const x =
        (word.bbox.x0 +
          word.bbox.x1) / 2;

      let nearest = null;
      let distance = Infinity;

      dates.forEach(d => {

        const dist =
          Math.abs(d.x - x);

        if (dist < distance) {

          distance = dist;
          nearest = d;
        }
      });

      const spacing =
        dates.length > 1
          ? Math.abs(
              dates[1].x -
              dates[0].x
            )
          : w / 30;

      if (
        nearest &&
        distance <= spacing * 0.55
      ) {

        found.push({
          day: nearest.day,
          shift
        });
      }
    });

    // 同じ日を重複登録しない
    const result = [];
    const used = {};

    found.forEach(x => {

      if (
        x.day >= 1 &&
        x.day <= 31 &&
        !used[x.day]
      ) {

        used[x.day] = true;

        result.push(x);
      }
    });

    return result.sort(
      (a, b) => a.day - b.day
    );
  }

  // ==============================
  // 保存
  // ==============================

  function loadStoredShifts() {

    try {

      const raw =
        localStorage.getItem(
          "monthlyTodo"
        );

      const data =
        raw
          ? JSON.parse(raw)
          : {};

      return data &&
        data.shifts &&
        typeof data.shifts === "object"
        ? data.shifts
        : {};

    } catch (e) {

      return {};
    }
  }

  function saveStoredShifts(shifts) {

    try {

      const raw =
        localStorage.getItem(
          "monthlyTodo"
        );

      const data =
        raw
          ? JSON.parse(raw) || {}
          : {};

      data.shifts = shifts;

      localStorage.setItem(
        "monthlyTodo",
        JSON.stringify(data)
      );

    } catch (e) {

      console.error(e);

      alert(
        "シフトを保存できませんでした。"
      );
    }
  }

  // ==============================
  // 読み取り結果確認
  // ==============================

  function showShiftResult(
    result,
    year,
    month
  ) {

    const bg =
      document.createElement("div");

    bg.style.cssText =
      "position:fixed;inset:0;background:#0006;" +
      "z-index:9999;display:flex;" +
      "align-items:center;justify-content:center;" +
      "padding:15px;";

    const box =
      document.createElement("div");

    box.style.cssText =
      "background:#fffefa;width:min(480px,100%);" +
      "max-height:90vh;overflow:auto;" +
      "border-radius:15px;padding:20px;" +
      "box-shadow:0 12px 40px #0004;";

    const rows =
      result
        .map(
          item => `
      <div style="
        display:flex;
        align-items:center;
        gap:8px;
        margin-bottom:7px
      ">
        <div style="
          width:55px;
          font-weight:600
        ">
          ${month}/${item.day}
        </div>

        <select
          data-day="${item.day}"
          style="
            flex:1;
            height:38px;
            border:1px solid #d0c8be;
            border-radius:7px;
            padding:4px 8px;
            font-size:15px
          "
        >
          ${SHIFT_CODES.map(
            code =>
              `<option value="${code}" ${
                code === item.shift
                  ? "selected"
                  : ""
              }>${code}</option>`
          ).join("")}

          <option value="">
            なし
          </option>

        </select>
      </div>
    `
        )
        .join("");

    box.innerHTML = `

      <h2 style="margin:0 0 10px">
        シフトを確認
      </h2>

      <p style="
        font-size:13px;
        color:#777;
        line-height:1.6
      ">
        写真から読み取った結果です。
        間違っているところは、
        ここで修正してから反映できます。
      </p>

      <div style="
        max-height:420px;
        overflow:auto;
        padding:8px;
        background:#faf8f3;
        border-radius:9px
      ">
        ${rows}
      </div>

      <div style="
        margin-top:12px;
        padding:10px;
        background:#f4f1eb;
        border-radius:8px;
        font-size:12px;
        line-height:1.6
      ">
        📅 ${year}年${month}月<br>
        読み取った日数：${result.length}日
      </div>

      <div style="
        display:flex;
        gap:8px;
        margin-top:15px
      ">

        <button
          id="shiftResultCancel"
          style="
            flex:1;
            min-height:42px;
            border:1px solid #d0c8be;
            background:white;
            border-radius:8px
          "
        >
          キャンセル
        </button>

        <button
          id="shiftResultApply"
          style="
            flex:1;
            min-height:42px;
            border:0;
            background:#626960;
            color:white;
            border-radius:8px;
            font-weight:600
          "
        >
          カレンダーへ反映
        </button>

      </div>
    `;

    bg.appendChild(box);
    document.body.appendChild(bg);

    box.querySelector(
      "#shiftResultCancel"
    ).onclick = () => bg.remove();

    box.querySelector(
      "#shiftResultApply"
    ).onclick = () => {

      const shifts =
        loadStoredShifts();

      box.querySelectorAll(
        "select[data-day]"
      ).forEach(select => {

        const key =
          dateKey(
            year,
            month,
            Number(
              select.dataset.day
            )
          );

        if (select.value) {
          shifts[key] =
            select.value;
        } else {
          delete shifts[key];
        }
      });

      saveStoredShifts(shifts);

      bg.remove();

      location.reload();
    };
  }

  // ==============================
  // 初期化
  // ==============================

  function init() {

    try {
      addImportButton();
    } catch (e) {
      console.error(
        "shift-import init error",
        e
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

})();
