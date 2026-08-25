// Monthly Todo - シフト表画像インポート
// 写真から「自分の行」のシフトを読み取り、確認後にカレンダーへ反映

(function () {
  "use strict";

  const SHIFT_IMPORT_VERSION = "2.0";

  const SHIFT_CODES = [
    "A", "B", "C1", "D", "E", "H",
    "週", "振", "出", "勤", "休"
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function normalizeShift(s) {
    if (!s) return "";

    s = String(s)
      .trim()
      .replace(/[|｜]/g, "")
      .replace(/[。、．.,]/g, "");

    if (s === "CI" || s === "Cl" || s === "CL" || s === "c1") {
      return "C1";
    }

    if (s === "A" || s === "B" || s === "D" ||
        s === "E" || s === "H") {
      return s;
    }

    if (s === "C1") return "C1";
    if (s === "週") return "週";
    if (s === "振") return "振";
    if (s === "出") return "出";
    if (s === "勤") return "勤";
    if (s === "休") return "休";

    return "";
  }

  function getCurrentMonth() {
    const el = document.getElementById("month");

    if (el) {
      const m = el.textContent.match(/(\d{4})年\s*(\d{1,2})月/);
      if (m) {
        return {
          year: Number(m[1]),
          month: Number(m[2])
        };
      }
    }

    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(year, month, day) {
    return year + "-" + pad(month) + "-" + pad(day);
  }

  function showMessage(title, message) {
    alert(title + "\n\n" + message);
  }

  function addImportButton() {
    if (document.getElementById("shiftImportButton")) return;

    const btn = document.createElement("button");
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

        const monthInfo = getCurrentMonth();

        const settings = await showSettings(monthInfo);

        if (!settings) {
          resetButton();
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
            "写真の中から指定した行のシフトを確認できませんでした。\n\n" +
            "・写真全体が入っているか\n" +
            "・シフト表が明るく写っているか\n" +
            "・自分の名前が読めるか\n\n" +
            "を確認して、もう一度試してください。"
          );

          resetButton();
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
      }

      resetButton();
    };

    function resetButton() {
      btn.disabled = false;
      btn.textContent = "📷 シフト表を読み込む";
      input.value = "";
    }

    const app = document.querySelector(".app");
    const calendar = document.querySelector(".calendar");

    if (app && calendar) {
      app.insertBefore(btn, calendar);
      app.insertBefore(input, calendar);
    }
  }

  function showSettings(monthInfo) {
    return new Promise(resolve => {
      const bg = document.createElement("div");

      bg.style.cssText = `
        position:fixed;
        inset:0;
        background:#0006;
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
      `;

      const box = document.createElement("div");

      box.style.cssText = `
        background:#fffefa;
        width:min(430px,100%);
        border-radius:15px;
        padding:20px;
        box-shadow:0 12px 40px #0004;
      `;

      box.innerHTML = `
        <h2 style="margin:0 0 15px">
          シフト表を読み込む
        </h2>

        <p style="font-size:13px;color:#777;line-height:1.6">
          写真の中から、あなたの行を探して読み取ります。
        </p>

        <label style="
          display:block;
          font-size:12px;
          color:#777;
          margin-bottom:5px;
        ">
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
            box-sizing:border-box;
          "
        >

        <div style="margin-top:15px">

          <label style="
            display:block;
            font-size:12px;
            color:#777;
            margin-bottom:5px;
          ">
            対象年月
          </label>

          <div style="
            display:flex;
            gap:7px;
          ">

            <input
              id="shiftYear"
              type="number"
              value="${monthInfo.year}"
              style="
                width:50%;
                height:44px;
                border:1px solid #d0c8be;
                border-radius:8px;
                padding:8px;
                font-size:16px;
                box-sizing:border-box;
              "
            >

            <input
              id="shiftMonth"
              type="number"
              min="1"
              max="12"
              value="${monthInfo.month}"
              style="
                width:50%;
                height:44px;
                border:1px solid #d0c8be;
                border-radius:8px;
                padding:8px;
                font-size:16px;
                box-sizing:border-box;
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
          line-height:1.6;
        ">
          💡 今回のシフト表なら「久山」、
          年月は「2026年9月」でOKです。
        </p>

        <div style="
          display:flex;
          gap:8px;
          margin-top:16px;
        ">

          <button id="shiftSettingCancel"
            style="
              flex:1;
              min-height:42px;
              border:1px solid #d0c8be;
              background:white;
              border-radius:8px;
            ">
            キャンセル
          </button>

          <button id="shiftSettingOK"
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
              font-weight:600;
            ">
            読み取り開始
          </button>

        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      const close = () => bg.remove();

      box.querySelector("#shiftSettingCancel").onclick = () => {
        close();
        resolve(null);
      };

      box.querySelector("#shiftSettingOK").onclick = () => {
        const name =
          box.querySelector("#shiftRowName").value.trim();

        const year =
          Number(box.querySelector("#shiftYear").value);

        const month =
          Number(box.querySelector("#shiftMonth").value);

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

  async function readShiftImage(file, rowName) {

    const image = await loadImage(file);

    /*
      OCR用に画像を拡大する。
      小さい文字のシフト表では、この処理がかなり重要。
    */

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

    const result = await Tesseract.recognize(
      canvas,
      "jpn+eng",
      {
        logger: m => {
          if (m.status === "recognizing text") {
            console.log(
              "OCR:",
              Math.round((m.progress || 0) * 100) + "%"
            );
          }
        }
      }
    );

    const words =
      result.data &&
      result.data.words
        ? result.data.words
        : [];

    if (!words.length) return [];

    const w = canvas.width;
    const h = canvas.height;

    /*
      「久山」を探す。
      左側の名前欄と右側の名前欄に同じ名前があるため、
      左側のものを優先する。
    */

    const targetWords = words.filter(word => {
      const text = String(word.text || "")
        .replace(/\s/g, "");

      const x = word.bbox.x0;

      return text.includes(rowName) &&
        x < w * 0.25;
    });

    if (!targetWords.length) {
      return [];
    }

    const target = targetWords[0];

    const rowY =
      (target.bbox.y0 + target.bbox.y1) / 2;

    /*
      シフト表の横位置。
      上部の日付「1～30」をOCRから探し、
      それぞれのX位置を取得する。
    */

    const dateWords = words.filter(word => {

      const text =
        String(word.text || "")
          .trim();

      const n = Number(text);

      if (!Number.isInteger(n)) return false;
      if (n < 1 || n > 31) return false;

      const y =
        (word.bbox.y0 + word.bbox.y1) / 2;

      return y < rowY - h * 0.18;
    });

    let datePositions = [];

    dateWords.forEach(word => {

      const n = Number(
        String(word.text || "").trim()
      );

      const x =
        (word.bbox.x0 + word.bbox.x1) / 2;

      const y =
        (word.bbox.y0 + word.bbox.y1) / 2;

      if (
        x > w * 0.05 &&
        x < w * 0.96 &&
        y < h * 0.25
      ) {
        datePositions.push({
          day:n,
          x,
          y
        });
      }
    });

    /*
      同じ日付が複数回認識された場合は、
      X位置が近いものをまとめる。
    */

    datePositions.sort((a,b) => a.x - b.x);

    const uniqueDates = [];

    datePositions.forEach(p => {

      const existing =
        uniqueDates.find(
          x => Math.abs(x.x - p.x) < w * 0.015
        );

      if (!existing) {
        uniqueDates.push(p);
      }
    });

    /*
      30日分の位置が十分取れなかった場合は、
      シフト表の標準的な30列配置から推定する。
    */

    if (uniqueDates.length < 15) {

      uniqueDates.length = 0;

      const startX = w * 0.086;
      const endX = w * 0.935;

      const width =
        (endX - startX) / 30;

      for (let d = 1; d <= 30; d++) {

        uniqueDates.push({
          day:d,
          x:startX + width * (d - 0.5)
        });
      }

    } else {

      /*
        OCRで取れた日付から
        日付→X位置の直線を作る。
      */

      const points =
        uniqueDates.filter(
          p => p.day >= 1 && p.day <= 30
        );

      if (points.length >= 2) {

        let sumX = 0;
        let sumD = 0;
        let sumDD = 0;
        let sumDX = 0;

        points.forEach(p => {
          sumX += p.x;
          sumD += p.day;
          sumDD += p.day * p.day;
          sumDX += p.day * p.x;
        });

        const n = points.length;

        const denominator =
          n * sumDD - sumD * sumD;

        if (denominator !== 0) {

          const slope =
            (n * sumDX - sumD * sumX) /
            denominator;

          const intercept =
            (sumX - slope * sumD) / n;

          uniqueDates.length = 0;

          for (let d = 1; d <= 31; d++) {

            uniqueDates.push({
              day:d,
              x:intercept + slope * d
            });

          }
        }
      }
    }

    /*
      名前の行にある文字を集める。
    */

    const rowHeight = h * 0.045;

    const rowWords = words.filter(word => {

      const text =
        String(word.text || "")
          .trim();

      const y =
        (word.bbox.y0 + word.bbox.y1) / 2;

      return Math.abs(y - rowY) < rowHeight;
    });

    const found = [];

    rowWords.forEach(word => {

      const raw =
        String(word.text || "")
          .trim();

      const shift =
        normalizeShift(raw);

      if (!shift) return;

      const x =
        (word.bbox.x0 + word.bbox.x1) / 2;

      /*
        一番近い日付列を探す。
      */

      let nearest = null;
      let distance = Infinity;

      uniqueDates.forEach(d => {

        const dist =
          Math.abs(d.x - x);

        if (dist < distance) {
          distance = dist;
          nearest = d;
        }
      });

      if (!nearest) return;

      /*
        別の行の文字を拾わないよう、
        日付列幅の半分程度以内だけ採用。
      */

      const spacing =
        uniqueDates.length >= 2
          ? Math.abs(
              uniqueDates[1].x -
              uniqueDates[0].x
            )
          : w / 30;

      if (distance > spacing * 0.48) return;

      found.push({
        day:nearest.day,
        shift
      });
    });

    /*
      同じ日に複数の文字が認識された場合、
      後から入ったものより最初のものを優先。
    */

    const result = [];
    const used = {};

    found.forEach(item => {

      if (
        item.day < 1 ||
        item.day > 31
      ) return;

      if (used[item.day]) return;

      used[item.day] = true;

      result.push(item);
    });

    result.sort((a,b) => a.day - b.day);

    return result;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {

      const img = new Image();

      img.onload = () => resolve(img);

      img.onerror = reject;

      img.src =
        URL.createObjectURL(file);
    });
  }

  function showShiftResult(result, year, month) {

    const bg = document.createElement("div");

    bg.style.cssText = `
      position:fixed;
      inset:0;
      background:#0006;
      z-index:9999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:15px;
    `;

    const box = document.createElement("div");

    box.style.cssText = `
      background:#fffefa;
      width:min(480px,100%);
      max-height:90vh;
      overflow:auto;
      border-radius:15px;
      padding:20px;
      box-shadow:0 12px 40px #0004;
    `;

    let rows = "";

    result.forEach(item => {

      rows += `
        <div style="
          display:flex;
          align-items:center;
          gap:8px;
          margin-bottom:7px;
        ">

          <div style="
            width:48px;
            font-weight:600;
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
              font-size:15px;
            "
          >
            ${SHIFT_CODES.map(code => `
              <option
                value="${code}"
                ${code === item.shift ? "selected" : ""}
              >
                ${code}
              </option>
            `).join("")}

            <option value="">なし</option>

          </select>

        </div>
      `;
    });

    box.innerHTML = `

      <h2 style="margin:0 0 10px">
        シフトを確認
      </h2>

      <p style="
        font-size:13px;
        color:#777;
        line-height:1.6;
      ">
        写真から読み取った結果です。<br>
        間違っているところがあれば、
        ここで修正してから反映できます。
      </p>

      <div style="
        max-height:420px;
        overflow:auto;
        padding:8px;
        background:#faf8f3;
        border-radius:9px;
      ">
        ${rows}
      </div>

      <div style="
        margin-top:12px;
        padding:10px;
        background:#f4f1eb;
        border-radius:8px;
        font-size:12px;
        line-height:1.6;
      ">
        📅 ${year}年${month}月<br>
        読み取った日数：${result.length}日
      </div>

      <div style="
        display:flex;
        gap:8px;
        margin-top:15px;
      ">

        <button id="shiftResultCancel"
          style="
            flex:1;
            min-height:42px;
            border:1px solid #d0c8be;
            background:white;
            border-radius:8px;
          ">
          キャンセル
        </button>

        <button id="shiftResultApply"
          style="
            flex:1;
            min-height:42px;
            border:0;
            background:#626960;
            color:white;
            border-radius:8px;
            font-weight:600;
          ">
          カレンダーへ反映
        </button>

      </div>
    `;

    document.body.appendChild(bg);
    bg.appendChild(box);

    box.querySelector(
      "#shiftResultCancel"
    ).onclick = () => {
      bg.remove();
    };

    box.querySelector(
      "#shiftResultApply"
    ).onclick = () => {

      const shifts =
        loadStoredShifts();

      box.querySelectorAll(
        "select[data-day]"
      ).forEach(select => {

        const day =
          Number(select.dataset.day);

        const value =
          select.value;

        const key =
          dateKey(year, month, day);

        if (value) {
          shifts[key] = value;
        } else {
          delete shifts[key];
        }
      });

      saveStoredShifts(shifts);

      bg.remove();

      /*
        index.html側のカレンダーを再読み込み。
        localStorageに保存したシフトを
        元のアプリが読み込む。
      */

      location.reload();
    };
  }

  function loadStoredShifts() {

    try {

      const raw =
        localStorage.getItem("monthlyTodo");

      if (!raw) return {};

      const data =
        JSON.parse(raw);

      if (
        data &&
        data.shifts &&
        typeof data.shifts === "object"
      ) {
        return data.shifts;
      }

    } catch (e) {
      console.error(e);
    }

    return {};
  }

  function saveStoredShifts(shifts) {

    try {

      const raw =
        localStorage.getItem("monthlyTodo");

      let data = {};

      if (raw) {
        data = JSON.parse(raw) || {};
      }

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

  function init() {
    addImportButton();
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
