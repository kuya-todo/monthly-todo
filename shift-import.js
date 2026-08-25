(function () {
  "use strict";

  const VERSION = "5.0";

  const SHIFT_CODES = [
    "",
    "A",
    "B",
    "C1",
    "D",
    "E",
    "H",
    "週",
    "振",
    "出",
    "勤",
    "休"
  ];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function monthInfo() {
    const el = document.getElementById("month");

    if (el) {
      const m = el.textContent.match(
        /(\d{4})年\s*(\d{1,2})月/
      );

      if (m) {
        return {
          year: Number(m[1]),
          month: Number(m[2])
        };
      }
    }

    const d = new Date();

    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1
    };
  }

  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function clean(s) {
    return String(s || "")
      .replace(/\s/g, "")
      .trim();
  }

  function normalize(s) {
    let t = clean(s).toUpperCase();

    if (!t) return "";

    t = t
      .replace(/Ｃ/g, "C")
      .replace(/１/g, "1")
      .replace(/Ａ/g, "A")
      .replace(/Ｂ/g, "B")
      .replace(/Ｄ/g, "D")
      .replace(/Ｅ/g, "E")
      .replace(/Ｈ/g, "H");

    if (/C1|CI|CL/.test(t)) return "C1";
    if (/A|4/.test(t)) return "A";
    if (/B/.test(t)) return "B";
    if (/D/.test(t)) return "D";
    if (/E/.test(t)) return "E";
    if (/H/.test(t)) return "H";
    if (/週|周/.test(t)) return "週";
    if (/振/.test(t)) return "振";
    if (/出|中/.test(t)) return "出";
    if (/勤/.test(t)) return "勤";
    if (/休/.test(t)) return "休";

    return "";
  }

  function loadData() {
    try {
      return JSON.parse(
        localStorage.getItem("monthlyTodo")
      ) || {};
    } catch (e) {
      return {};
    }
  }

  function saveShifts(shifts) {
    const data = loadData();
    data.shifts = shifts;

    localStorage.setItem(
      "monthlyTodo",
      JSON.stringify(data)
    );
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  function loadOCR() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        resolve();
        return;
      }

      const s = document.createElement("script");

      s.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      s.onload = resolve;
      s.onerror = () =>
        reject(
          new Error(
            "OCRエンジンを読み込めませんでした"
          )
        );

      document.head.appendChild(s);
    });
  }

  function makeButton() {
    let button =
      document.getElementById(
        "shiftImportButton"
      );

    if (!button) {
      button =
        document.createElement("button");

      button.id =
        "shiftImportButton";

      button.textContent =
        "📷 シフト表を読み込む";

      button.style.cssText = `
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
        box-sizing:border-box;
      `;

      const app =
        document.querySelector(".app");

      const calendar =
        document.querySelector(".calendar");

      if (app && calendar) {
        app.insertBefore(
          button,
          calendar
        );
      } else {
        document.body.appendChild(button);
      }
    }

    if (
      button.dataset.version === VERSION
    ) {
      return;
    }

    button.dataset.version =
      VERSION;

    const input =
      document.createElement("input");

    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    document.body.appendChild(input);

    button.onclick = () =>
      input.click();

    input.onchange = async () => {
      if (!input.files[0]) return;

      const file = input.files[0];

      button.disabled = true;
      button.textContent =
        "📖 読み込み準備中…";

      try {
        const m = monthInfo();

        const setting =
          await settingDialog(m);

        if (!setting) return;

        await rowDialog(
          file,
          setting,
          button
        );

      } catch (e) {
        console.error(e);

        alert(
          "シフト表を読み込めませんでした。\n\n" +
          e.message
        );

      } finally {
        button.disabled = false;
        button.textContent =
          "📷 シフト表を読み込む";

        input.value = "";
      }
    };
  }

  function settingDialog(m) {
    return new Promise(resolve => {
      const bg =
        document.createElement("div");

      bg.style.cssText = `
        position:fixed;
        inset:0;
        z-index:9999;
        background:#0006;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:15px;
      `;

      const box =
        document.createElement("div");

      box.style.cssText = `
        background:#fffefa;
        width:min(430px,100%);
        border-radius:15px;
        padding:20px;
      `;

      box.innerHTML = `
        <h2 style="margin:0 0 14px">
          シフト表を読み込む
        </h2>

        <p style="font-size:13px;color:#777">
          写真を選んだあと、
          自分の行をタップします。
        </p>

        <div style="display:flex;gap:8px">

          <input
            id="siYear"
            type="number"
            value="${m.year}"
            style="
              width:50%;
              height:44px;
              font-size:16px;
              border:1px solid #d0c8be;
              border-radius:8px;
            "
          >

          <input
            id="siMonth"
            type="number"
            value="${m.month}"
            min="1"
            max="12"
            style="
              width:50%;
              height:44px;
              font-size:16px;
              border:1px solid #d0c8be;
              border-radius:8px;
            "
          >

        </div>

        <div style="
          margin-top:14px;
          padding:10px;
          background:#f4f1eb;
          border-radius:8px;
          font-size:12px;
        ">
          今回は
          <strong>${m.year}年${m.month}月</strong>
          のシフト表です。
        </div>

        <div style="
          display:flex;
          gap:8px;
          margin-top:15px;
        ">

          <button
            id="sic"
            style="
              flex:1;
              min-height:42px;
              border:1px solid #d0c8be;
              background:white;
              border-radius:8px;
            "
          >
            キャンセル
          </button>

          <button
            id="sio"
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
            "
          >
            写真を選ぶ
          </button>

        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      box.querySelector("#sic").onclick =
        () => {
          bg.remove();
          resolve(null);
        };

      box.querySelector("#sio").onclick =
        () => {
          const year =
            Number(
              box.querySelector("#siYear").value
            );

          const month =
            Number(
              box.querySelector("#siMonth").value
            );

          if (
            !year ||
            month < 1 ||
            month > 12
          ) {
            alert(
              "年月を確認してください。"
            );
            return;
          }

          bg.remove();

          resolve({
            year,
            month
          });
        };
    });
  }

  async function rowDialog(
    file,
    setting,
    button
  ) {
    const img =
      await loadImage(file);

    return new Promise(resolve => {

      const bg =
        document.createElement("div");

      bg.style.cssText = `
        position:fixed;
        inset:0;
        z-index:9999;
        background:#0008;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:10px;
      `;

      const box =
        document.createElement("div");

      box.style.cssText = `
        width:min(760px,100%);
        max-height:95vh;
        overflow:auto;
        background:#fffefa;
        border-radius:15px;
        padding:15px;
      `;

      box.innerHTML = `
        <h2 style="margin:0 0 8px">
          自分の行をタップ
        </h2>

        <p style="
          font-size:13px;
          color:#777;
          line-height:1.6;
        ">
          「久山」さんの水色の行の
          中央あたりをタップしてください。
        </p>

        <div
          id="photoBox"
          style="
            position:relative;
            width:100%;
            overflow:auto;
            background:#eee;
            border-radius:8px;
          "
        >
          <img
            id="shiftPhoto"
            style="
              display:block;
              width:100%;
              height:auto;
            "
          >

          <div
            id="guide"
            style="
              display:none;
              position:absolute;
              left:0;
              right:0;
              height:5px;
              background:#e45b5b;
              pointer-events:none;
            "
          ></div>
        </div>

        <p style="
          font-size:12px;
          color:#777;
          margin:9px 0;
        ">
          赤い線が選択した行です。
        </p>

        <div style="
          display:flex;
          gap:8px;
        ">

          <button
            id="rc"
            style="
              flex:1;
              min-height:42px;
              border:1px solid #d0c8be;
              background:white;
              border-radius:8px;
            "
          >
            キャンセル
          </button>

          <button
            id="rr"
            disabled
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
              opacity:.45;
            "
          >
            この行を読み取る
          </button>

        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      const photo =
        box.querySelector(
          "#shiftPhoto"
        );

      const guide =
        box.querySelector(
          "#guide"
        );

      const read =
        box.querySelector(
          "#rr"
        );

      photo.src =
        URL.createObjectURL(file);

      let y = null;

      photo.onclick = e => {
        const r =
          photo.getBoundingClientRect();

        y =
          (e.clientY - r.top) *
          (
            img.naturalHeight /
            r.height
          );

        guide.style.display =
          "block";

        guide.style.top =
          (
            y /
            img.naturalHeight *
            100
          ) + "%";

        read.disabled = false;
        read.style.opacity = "1";
      };

      box.querySelector("#rc").onclick =
        () => {
          bg.remove();
          resolve();
        };

      read.onclick = async () => {
        if (y == null) return;

        read.disabled = true;
        read.textContent =
          "📖 読み取っています…";

        try {
          const result =
            await readRow(
              img,
              y,
              setting.year,
              setting.month,
              button
            );

          bg.remove();

          showResult(
            result,
            setting.year,
            setting.month
          );

        } catch (e) {
          console.error(e);

          alert(
            "読み取りに失敗しました。\n\n" +
            e.message
          );

          read.disabled = false;
          read.textContent =
            "この行を読み取る";
        }

        resolve();
      };
    });
  }

  async function readRow(
    img,
    rowY,
    year,
    month,
    button
  ) {
    await loadOCR();

    const maxW = 1800;

    const scale =
      Math.min(
        1,
        maxW / img.naturalWidth
      );

    const source =
      document.createElement("canvas");

    source.width =
      Math.round(
        img.naturalWidth * scale
      );

    source.height =
      Math.round(
        img.naturalHeight * scale
      );

    const ctx =
      source.getContext(
        "2d",
        {
          willReadFrequently:true
        }
      );

    ctx.drawImage(
      img,
      0,
      0,
      source.width,
      source.height
    );

    /*
     * 元画像の行座標を
     * canvas座標に変換。
     */
    const sy =
      rowY * scale;

    const h =
      source.height;

    const w =
      source.width;

    /*
     * 今回の表では、
     * 日付欄は写真の中央～右側。
     *
     * 左右の名前欄を避けて
     * 30日分を均等分割する。
     */
    const left =
      Math.round(w * 0.075);

    const right =
      Math.round(w * 0.925);

    const cellW =
      (right - left) / 30;

    const rowH =
      Math.max(
        28,
        Math.round(h * 0.045)
      );

    const top =
      Math.max(
        0,
        Math.round(
          sy - rowH / 2
        )
      );

    const bottom =
      Math.min(
        h,
        Math.round(
          sy + rowH / 2
        )
      );

    const worker =
      await Tesseract.createWorker(
        ["eng", "jpn"],
        1,
        {
          logger: m => {
            if (
              m.progress != null &&
              m.status
            ) {
              button.textContent =
                "📖 読み取り " +
                Math.round(
                  m.progress * 100
                ) +
                "%";
            }
          }
        }
      );

    const result = [];

    try {

      await worker.setParameters({
        tessedit_pageseg_mode:
          "10"
      });

      const count =
        daysInMonth(
          year,
          month
        );

      for (
        let day = 1;
        day <= count;
        day++
      ) {

        const x =
          left +
          cellW *
          (day - 1);

        /*
         * 罫線を避けるため、
         * 左右を18%ずつカット。
         */
        const margin =
          cellW * 0.18;

        const sx =
          Math.round(
            x + margin
          );

        const sw =
          Math.max(
            10,
            Math.round(
              cellW -
              margin * 2
            )
          );

        const sh =
          Math.max(
            10,
            bottom - top
          );

        const c =
          document.createElement(
            "canvas"
          );

        c.width =
          sw * 6;

        c.height =
          sh * 6;

        const cc =
          c.getContext("2d");

        cc.fillStyle =
          "white";

        cc.fillRect(
          0,
          0,
          c.width,
          c.height
        );

        cc.drawImage(
          source,
          sx,
          top,
          sw,
          sh,
          0,
          0,
          c.width,
          c.height
        );

        /*
         * OCRを2種類のモードで試す。
         */
        const texts = [];

        for (
          const psm of ["10", "13"]
        ) {
          try {
            await worker.setParameters({
              tessedit_pageseg_mode:
                psm
            });

            const r =
              await worker.recognize(c);

            const t =
              clean(
                r.data.text
              );

            if (t) {
              texts.push(t);
            }

          } catch (e) {}
        }

        const joined =
          texts.join("");

        let shift =
          normalize(joined);

        /*
         * OCRがCを読み違えるケース。
         */
        if (
          !shift &&
          /C1|CI|CL/.test(joined)
        ) {
          shift = "C1";
        }

        /*
         * 「週」「出」などは
         * 日本語OCRで取れた場合だけ採用。
         */
        if (
          /週|周/.test(joined)
        ) {
          shift = "週";
        }

        if (
          /振/.test(joined)
        ) {
          shift = "振";
        }

        if (
          /出/.test(joined)
        ) {
          shift = "出";
        }

        if (
          /勤/.test(joined)
        ) {
          shift = "勤";
        }

        if (
          /休/.test(joined)
        ) {
          shift = "休";
        }

        result.push({
          day,
          shift,
          detected: !!shift,
          raw: joined
        });

        /*
         * iPhoneに処理を返す。
         */
        if (
          day % 2 === 0
        ) {
          await new Promise(
            r =>
              setTimeout(r, 15)
          );
        }
      }

    } finally {
      await worker.terminate();
    }

    return result;
  }

  function showResult(
    result,
    year,
    month
  ) {
    const bg =
      document.createElement("div");

    bg.style.cssText = `
      position:fixed;
      inset:0;
      z-index:9999;
      background:#0006;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:15px;
    `;

    const box =
      document.createElement("div");

    box.style.cssText = `
      background:#fffefa;
      width:min(480px,100%);
      max-height:90vh;
      overflow:auto;
      border-radius:15px;
      padding:20px;
    `;

    const detected =
      result.filter(
        x => x.detected
      ).length;

    let html = "";

    result.forEach(item => {

      const options =
        SHIFT_CODES.map(code => {

          const text =
            code || "なし";

          return `
            <option
              value="${code}"
              ${
                code === item.shift
                  ? "selected"
                  : ""
              }
            >
              ${text}
            </option>
          `;
        }).join("");

      html += `
        <div style="
          display:flex;
          gap:7px;
          align-items:center;
          margin-bottom:7px;
        ">

          <div style="
            width:50px;
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
              font-size:15px;
              background:white;
            "
          >
            ${options}
          </select>

          <span style="
            width:28px;
            text-align:center;
            color:${item.detected ? "#4b875f" : "#aaa"};
          ">
            ${item.detected ? "✓" : "－"}
          </span>

        </div>
      `;
    });

    box.innerHTML = `
      <h2 style="margin:0 0 8px">
        シフトを確認
      </h2>

      <p style="
        font-size:13px;
        color:#777;
        line-height:1.6;
      ">
        自動判定された結果です。<br>
        間違っている日はここで修正してください。
      </p>

      <div style="
        padding:10px;
        margin-bottom:10px;
        background:#f4f1eb;
        border-radius:8px;
        font-size:12px;
      ">
        📅 ${year}年${month}月<br>
        自動検出：
        <strong>${detected}日</strong>
        / ${result.length}日
      </div>

      <div style="
        padding:8px;
        background:#faf8f3;
        border-radius:9px;
      ">
        ${html}
      </div>

      <div style="
        display:flex;
        gap:8px;
        margin-top:15px;
      ">

        <button
          id="cancelResult"
          style="
            flex:1;
            min-height:42px;
            border:1px solid #d0c8be;
            background:white;
            border-radius:8px;
          "
        >
          キャンセル
        </button>

        <button
          id="applyResult"
          style="
            flex:1;
            min-height:42px;
            border:0;
            background:#626960;
            color:white;
            border-radius:8px;
            font-weight:600;
          "
        >
          カレンダーへ反映
        </button>

      </div>
    `;

    bg.appendChild(box);
    document.body.appendChild(bg);

    box.querySelector(
      "#cancelResult"
    ).onclick = () =>
      bg.remove();

    box.querySelector(
      "#applyResult"
    ).onclick = () => {

      const shifts =
        loadData().shifts || {};

      box.querySelectorAll(
        "select[data-day]"
      ).forEach(select => {

        const day =
          Number(
            select.dataset.day
          );

        const key =
          dateKey(
            year,
            month,
            day
          );

        if (select.value) {
          shifts[key] =
            select.value;
        } else {
          delete shifts[key];
        }
      });

      saveShifts(shifts);

      bg.remove();

      location.reload();
    };
  }

  function init() {
    makeButton();
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
