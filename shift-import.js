// Monthly Todo - シフト表画像インポート
// v4.0
// 写真全体をOCRせず、指定した行だけを読み取る方式

(function () {
  "use strict";

  const VERSION = "4.0";

  const SHIFT_CODES = [
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

  const OCR_CODES = [
    "A",
    "B",
    "C1",
    "D",
    "E",
    "H"
  ];

  // --------------------------------------------------
  // 共通
  // --------------------------------------------------

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKey(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function currentMonth() {
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

    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/\s/g, "")
      .trim();
  }

  function normalizeShift(text) {
    let x = normalizeText(text);

    x = x
      .replace(/[。、．.,]/g, "")
      .replace(/[^A-Za-z0-9C1]/g, "");

    x = x.toUpperCase();

    if (
      x === "CI" ||
      x === "CL" ||
      x === "C1" ||
      x === "C"
    ) {
      return "C1";
    }

    if (OCR_CODES.includes(x)) {
      return x;
    }

    return "";
  }

  function showMessage(title, message) {
    alert(title + "\n\n" + message);
  }

  // --------------------------------------------------
  // Tesseract読み込み
  // --------------------------------------------------

  function loadTesseract() {
    return new Promise((resolve, reject) => {

      if (window.Tesseract) {
        resolve();
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      script.onload = () => resolve();

      script.onerror = () =>
        reject(
          new Error(
            "Tesseract.jsを読み込めませんでした"
          )
        );

      document.head.appendChild(script);
    });
  }

  // --------------------------------------------------
  // 読み込みボタン
  // --------------------------------------------------

  function addImportButton() {

    let btn =
      document.getElementById(
        "shiftImportButton"
      );

    if (
      btn &&
      btn.dataset.bound === VERSION
    ) {
      return;
    }

    if (!btn) {

      btn =
        document.createElement("button");

      btn.id =
        "shiftImportButton";

      btn.textContent =
        "📷 シフト表を読み込む";

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
        box-sizing:border-box;
      `;
    }

    const input =
      document.createElement("input");

    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    btn.onclick = () => {
      input.click();
    };

    input.onchange = async () => {

      if (
        !input.files ||
        !input.files[0]
      ) {
        return;
      }

      const file =
        input.files[0];

      btn.disabled = true;

      btn.textContent =
        "📖 読み込み準備中…";

      try {

        const m =
          currentMonth();

        const settings =
          await showSettings(m);

        if (!settings) {
          return;
        }

        await showRowPicker(
          file,
          settings,
          btn
        );

      } catch (e) {

        console.error(e);

        showMessage(
          "読み取りエラー",
          "写真を読み取れませんでした。\n\n" +
          "もう一度試してください。"
        );

      } finally {

        btn.disabled = false;

        btn.textContent =
          "📷 シフト表を読み込む";

        input.value = "";
      }
    };

    const slot =
      document.getElementById(
        "shift-import-slot"
      );

    const app =
      document.querySelector(".app");

    const calendar =
      document.querySelector(".calendar");

    if (slot) {

      slot.innerHTML = "";

      slot.appendChild(btn);
      slot.appendChild(input);

    } else if (app && calendar) {

      app.insertBefore(
        btn,
        calendar
      );

      app.insertBefore(
        input,
        calendar
      );

    } else {

      document.body.appendChild(btn);
      document.body.appendChild(input);
    }

    btn.dataset.bound =
      VERSION;
  }

  // --------------------------------------------------
  // 設定
  // --------------------------------------------------

  function showSettings(m) {

    return new Promise(resolve => {

      const bg =
        document.createElement("div");

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

      const box =
        document.createElement("div");

      box.style.cssText = `
        background:#fffefa;
        width:min(430px,100%);
        border-radius:15px;
        padding:20px;
        box-shadow:0 12px 40px #0004;
      `;

      box.innerHTML = `

        <h2 style="
          margin:0 0 15px;
          font-size:20px
        ">
          シフト表を読み込む
        </h2>

        <p style="
          font-size:13px;
          color:#777;
          line-height:1.7
        ">
          写真を選んだあと、
          自分の行をタップして読み取ります。
        </p>

        <label style="
          display:block;
          font-size:12px;
          color:#777;
          margin-bottom:5px
        ">
          対象年月
        </label>

        <div style="
          display:flex;
          gap:7px
        ">

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

        <div style="
          margin-top:15px;
          padding:11px;
          background:#f4f1eb;
          border-radius:8px;
          font-size:12px;
          line-height:1.6
        ">
          💡 今回の写真なら<br>
          <strong>2026年9月</strong>
          のままでOKです。
        </div>

        <div style="
          display:flex;
          gap:8px;
          margin-top:16px
        ">

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
            写真を選ぶ
          </button>

        </div>
      `;

      bg.appendChild(box);

      document.body.appendChild(bg);

      const close = () =>
        bg.remove();

      box.querySelector(
        "#shiftSettingCancel"
      ).onclick = () => {

        close();

        resolve(null);
      };

      box.querySelector(
        "#shiftSettingOK"
      ).onclick = () => {

        const year =
          Number(
            box.querySelector(
              "#shiftYear"
            ).value
          );

        const month =
          Number(
            box.querySelector(
              "#shiftMonth"
            ).value
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

        close();

        resolve({
          year,
          month
        });
      };
    });
  }

  // --------------------------------------------------
  // 画像
  // --------------------------------------------------

  function loadImage(file) {

    return new Promise(
      (resolve, reject) => {

        const img =
          new Image();

        const url =
          URL.createObjectURL(file);

        img.onload = () => {

          URL.revokeObjectURL(url);

          resolve(img);
        };

        img.onerror = reject;

        img.src = url;
      }
    );
  }

  // --------------------------------------------------
  // 行を選択
  // --------------------------------------------------

  async function showRowPicker(
    file,
    settings,
    btn
  ) {

    const image =
      await loadImage(file);

    return new Promise(resolve => {

      const bg =
        document.createElement("div");

      bg.style.cssText = `
        position:fixed;
        inset:0;
        background:#0008;
        z-index:9999;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        padding:12px;
      `;

      const box =
        document.createElement("div");

      box.style.cssText = `
        background:#fffefa;
        width:min(760px,100%);
        max-height:94vh;
        overflow:auto;
        border-radius:15px;
        padding:15px;
        box-shadow:0 12px 40px #0005;
      `;

      box.innerHTML = `

        <h2 style="
          margin:0 0 8px;
          font-size:19px
        ">
          自分の行をタップ
        </h2>

        <p style="
          margin:0 0 12px;
          font-size:13px;
          color:#777;
          line-height:1.6
        ">
          写真の中の
          <strong>「久山」さんの行</strong>
          の中央あたりをタップしてください。
        </p>

        <div
          id="shiftPhotoArea"
          style="
            position:relative;
            width:100%;
            overflow:auto;
            background:#eee;
            border-radius:8px;
            touch-action:manipulation;
          "
        >
          <img
            id="shiftPhoto"
            style="
              display:block;
              width:100%;
              height:auto;
              user-select:none;
              -webkit-user-select:none;
            "
          >

          <div
            id="rowGuide"
            style="
              display:none;
              position:absolute;
              left:0;
              right:0;
              height:4px;
              background:#e45b5b;
              box-shadow:0 0 0 2px #fff8;
              pointer-events:none;
            "
          ></div>
        </div>

        <div style="
          margin-top:10px;
          padding:10px;
          background:#f4f1eb;
          border-radius:8px;
          font-size:12px;
          line-height:1.6
        ">
          📌 赤い線が
          <strong>自分のシフト行</strong>
          の位置です。
        </div>

        <div style="
          display:flex;
          gap:8px;
          margin-top:12px
        ">

          <button
            id="rowCancel"
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
            id="rowRead"
            disabled
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
              font-weight:600;
              opacity:.45
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
          "#rowGuide"
        );

      const readButton =
        box.querySelector(
          "#rowRead"
        );

      let selectedY = null;

      photo.src =
        URL.createObjectURL(file);

      photo.onclick = event => {

        const rect =
          photo.getBoundingClientRect();

        const ratio =
          image.naturalHeight /
          rect.height;

        selectedY =
          (event.clientY -
            rect.top) *
          ratio;

        guide.style.display =
          "block";

        guide.style.top =
          (
            selectedY /
            image.naturalHeight *
            100
          ) + "%";

        readButton.disabled =
          false;

        readButton.style.opacity =
          "1";
      };

      box.querySelector(
        "#rowCancel"
      ).onclick = () => {

        bg.remove();

        resolve();
      };

      readButton.onclick = async () => {

        if (selectedY == null) {
          return;
        }

        readButton.disabled =
          true;

        readButton.textContent =
          "📖 読み取っています…";

        try {

          const result =
            await readSelectedRow(
              image,
              selectedY,
              settings.year,
              settings.month,
              btn
            );

          bg.remove();

          showShiftResult(
            result,
            settings.year,
            settings.month
          );

        } catch (e) {

          console.error(e);

          alert(
            "シフト行を読み取れませんでした。\n\n" +
            "もう一度、行の中央をタップして試してください。"
          );

          readButton.disabled =
            false;

          readButton.textContent =
            "この行を読み取る";
        }

        resolve();
      };
    });
  }

  // --------------------------------------------------
  // セル画像を作る
  // --------------------------------------------------

  function makeCellCanvas(
    image,
    x,
    y,
    width,
    height
  ) {

    const scale = 3;

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      Math.max(
        20,
        Math.round(
          width * scale
        )
      );

    canvas.height =
      Math.max(
        20,
        Math.round(
          height * scale
        )
      );

    const ctx =
      canvas.getContext(
        "2d",
        { willReadFrequently:true }
      );

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      image,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // コントラストを少し上げる
    const data =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    for (
      let i = 0;
      i < data.data.length;
      i += 4
    ) {

      const r =
        data.data[i];

      const g =
        data.data[i + 1];

      const b =
        data.data[i + 2];

      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      const v =
        gray < 175
          ? 0
          : 255;

      data.data[i] =
        v;

      data.data[i + 1] =
        v;

      data.data[i + 2] =
        v;
    }

    ctx.putImageData(
      data,
      0,
      0
    );

    return canvas;
  }

  // --------------------------------------------------
  // OCR 1セル
  // --------------------------------------------------

  async function recognizeCell(
    worker,
    canvas
  ) {

    const timeout =
      new Promise(
        (_, reject) => {

          setTimeout(
            () =>
              reject(
                new Error(
                  "OCR timeout"
                )
              ),
            8000
          );
        }
      );

    const recognition =
      worker.recognize(
        canvas
      );

    const result =
      await Promise.race([
        recognition,
        timeout
      ]);

    const text =
      result &&
      result.data
        ? result.data.text
        : "";

    return normalizeShift(text);
  }

  // --------------------------------------------------
  // 選択した行を読む
  // --------------------------------------------------

  async function readSelectedRow(
    image,
    rowY,
    year,
    month,
    btn
  ) {

    await loadTesseract();

    const width =
      image.naturalWidth;

    const height =
      image.naturalHeight;

    const dayCount =
      daysInMonth(
        year,
        month
      );

    /*
      このシフト表の構造：

      左側の名前欄
      ↓
      1日〜月末の勤務欄
      ↓
      右側の名前欄

      現在使用している用紙に合わせて
      勤務欄の左右位置を設定しています。
    */

    const dayLeft =
      width * 0.080;

    const dayRight =
      width * 0.918;

    const dayWidth =
      (
        dayRight -
        dayLeft
      ) / dayCount;

    /*
      行の高さ。
      タップ位置を中心にして
      上下を少しだけ切り出します。
    */

    const rowHeight =
      Math.max(
        24,
        height * 0.045
      );

    const rowTop =
      Math.max(
        0,
        rowY -
        rowHeight / 2
      );

    const rowBottom =
      Math.min(
        height,
        rowY +
        rowHeight / 2
      );

    const actualRowHeight =
      rowBottom -
      rowTop;

    btn.textContent =
      "📖 OCRを準備しています…";

    const worker =
      await Tesseract.createWorker(
        ["eng", "jpn"],
        1,
        {
          logger: m => {

            if (
              m.status &&
              m.progress != null
            ) {

              const p =
                Math.round(
                  m.progress * 100
                );

              btn.textContent =
                "📖 シフトを読み取っています " +
                p +
                "%";
            }
          }
        }
      );

    try {

      await worker.setParameters({
        tessedit_pageseg_mode:
          Tesseract.PSM.SINGLE_WORD,

        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      });

      const result = [];

      for (
        let day = 1;
        day <= dayCount;
        day++
      ) {

        const cellX =
          dayLeft +
          dayWidth *
          (day - 1);

        /*
          セルの左右に少し余白を入れる。
          縦罫線をOCRしないため。
        */

        const marginX =
          Math.max(
            3,
            dayWidth * 0.16
          );

        const canvas =
          makeCellCanvas(
            image,
            cellX + marginX,
            rowTop,
            Math.max(
              10,
              dayWidth -
              marginX * 2
            ),
            actualRowHeight
          );

        let shift = "";

        try {

          shift =
            await recognizeCell(
              worker,
              canvas
            );

        } catch (e) {

          console.log(
            "OCR skip day",
            day,
            e
          );

          shift = "";
        }

        /*
          OCRで取れたA/B/C1/D/E/Hだけ採用。
          空欄はシフトなしとして扱います。
        */

        if (shift) {

          result.push({
            day,
            shift
          });
        }

        /*
          iPhoneで処理が固まらないよう、
          少しずつUIへ制御を返す。
        */

        if (
          day % 3 === 0
        ) {

          await new Promise(
            r =>
              setTimeout(
                r,
                20
              )
          );
        }
      }

      /*
        日本語シフト
        「週」「振」「出」「勤」「休」は
        OCRだけでは不安定なので、
        今回は確認画面で手動追加・修正できます。
      */

      return result;

    } finally {

      await worker.terminate();
    }
  }

  // --------------------------------------------------
  // 読み取り結果
  // --------------------------------------------------

  function showShiftResult(
    result,
    year,
    month
  ) {

    const dayCount =
      daysInMonth(
        year,
        month
      );

    const resultMap = {};

    result.forEach(item => {
      resultMap[item.day] =
        item.shift;
    });

    const bg =
      document.createElement("div");

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

    const box =
      document.createElement("div");

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

    for (
      let day = 1;
      day <= dayCount;
      day++
    ) {

      const current =
        resultMap[day] || "";

      rows += `

        <div style="
          display:flex;
          align-items:center;
          gap:7px;
          margin-bottom:7px
        ">

          <div style="
            width:48px;
            font-weight:600
          ">
            ${month}/${day}
          </div>

          <select
            data-day="${day}"
            style="
              flex:1;
              height:38px;
              border:1px solid #d0c8be;
              border-radius:7px;
              padding:4px 8px;
              font-size:15px
            "
          >

            <option value="">
              なし
            </option>

            ${SHIFT_CODES.map(
              code => `
                <option
                  value="${code}"
                  ${
                    code === current
                      ? "selected"
                      : ""
                  }
                >
                  ${code}
                </option>
              `
            ).join("")}

          </select>

        </div>
      `;
    }

    box.innerHTML = `

      <h2 style="
        margin:0 0 10px
      ">
        シフトを確認
      </h2>

      <p style="
        font-size:13px;
        color:#777;
        line-height:1.7
      ">
        写真から読み取った結果です。<br>
        間違っているところは、
        ここで修正できます。
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
        OCRで自動検出：
        ${result.length}日
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

      saveStoredShifts(
        shifts
      );

      bg.remove();

      location.reload();
    };
  }

  // --------------------------------------------------
  // localStorage
  // --------------------------------------------------

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

      if (
        data &&
        data.shifts &&
        typeof data.shifts ===
          "object"
      ) {

        return data.shifts;
      }

    } catch (e) {

      console.error(e);
    }

    return {};
  }

  function saveStoredShifts(
    shifts
  ) {

    try {

      const raw =
        localStorage.getItem(
          "monthlyTodo"
        );

      const data =
        raw
          ? JSON.parse(raw) || {}
          : {};

      data.shifts =
        shifts;

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

  // --------------------------------------------------
  // 初期化
  // --------------------------------------------------

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
