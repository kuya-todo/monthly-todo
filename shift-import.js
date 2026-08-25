(function () {
  "use strict";

  const VERSION = "7.0";

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

  const pad = n => String(n).padStart(2, "0");

  const dateKey = (y, m, d) =>
    `${y}-${pad(m)}-${pad(d)}`;

  function clean(text) {
    return String(text || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .trim();
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

  function monthInfo() {
    const el =
      document.getElementById("month");

    if (el) {
      const m =
        el.textContent.match(
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

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      const url =
        URL.createObjectURL(file);

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

      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

      script.onload = resolve;

      script.onerror = () => {
        reject(
          new Error(
            "OCRエンジンを読み込めませんでした。"
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  /* --------------------------------
     読み込みボタン
  -------------------------------- */

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

      button.style.cssText =
        [
          "display:block",
          "width:100%",
          "margin:10px 0",
          "padding:14px",
          "border:1px solid #d0c8be",
          "border-radius:10px",
          "background:#fffefa",
          "color:#403b36",
          "font-size:16px",
          "font-weight:700",
          "box-sizing:border-box"
        ].join(";");

      const app =
        document.querySelector(".app");

      const calendar =
        document.querySelector(".calendar");

      if (app && calendar) {
        app.insertBefore(
          button,
          calendar
        );
      } else if (app) {
        app.insertBefore(
          button,
          app.firstChild
        );
      } else {
        document.body.appendChild(
          button
        );
      }
    }

    let input =
      document.getElementById(
        "shiftImportInput"
      );

    if (!input) {

      input =
        document.createElement("input");

      input.id =
        "shiftImportInput";

      input.type = "file";

      input.accept =
        "image/*";

      input.style.display =
        "none";

      document.body.appendChild(
        input
      );
    }

    button.onclick = () => {
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

      button.disabled = true;

      button.textContent =
        "📖 読み込み準備中…";

      try {

        const setting =
          await settingDialog(
            monthInfo()
          );

        if (setting) {

          await rowDialog(
            file,
            setting,
            button
          );
        }

      } catch (e) {

        console.error(e);

        alert(
          "シフト表を読み込めませんでした。\n\n" +
          (e.message || e)
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "📷 シフト表を読み込む";

        input.value = "";
      }
    };
  }

  /* --------------------------------
     月設定
  -------------------------------- */

  function settingDialog(m) {

    return new Promise(resolve => {

      const bg =
        document.createElement("div");

      bg.style.cssText =
        "position:fixed;" +
        "inset:0;" +
        "z-index:9999;" +
        "background:#0006;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "padding:15px;";

      const box =
        document.createElement("div");

      box.style.cssText =
        "background:#fffefa;" +
        "width:min(430px,100%);" +
        "border-radius:15px;" +
        "padding:20px;";

      box.innerHTML = `

        <h2 style="margin:0 0 14px">
          シフト表を読み込む
        </h2>

        <p style="
          font-size:13px;
          color:#777;
          line-height:1.6;
        ">
          写真を選んだあと、
          「久山」さんの水色の行を
          タップします。
          <br>
          写真が少し傾いていても、
          日付マスを自動調整します。
        </p>

        <div style="
          display:flex;
          gap:8px;
        ">

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
          読み込む月：
          <strong>
            ${m.year}年${m.month}月
          </strong>
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

      box.querySelector("#sic")
        .onclick = () => {

          bg.remove();

          resolve(null);
        };

      box.querySelector("#sio")
        .onclick = () => {

          const year =
            Number(
              box.querySelector(
                "#siYear"
              ).value
            );

          const month =
            Number(
              box.querySelector(
                "#siMonth"
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

          bg.remove();

          resolve({
            year,
            month
          });
        };
    });
  }

  /* --------------------------------
     行選択画面
  -------------------------------- */

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

      bg.style.cssText =
        "position:fixed;" +
        "inset:0;" +
        "z-index:9999;" +
        "background:#0008;" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "padding:10px;";

      const box =
        document.createElement("div");

      box.style.cssText =
        "width:min(900px,100%);" +
        "max-height:96vh;" +
        "overflow:auto;" +
        "background:#fffefa;" +
        "border-radius:15px;" +
        "padding:15px;";

      box.innerHTML = `

        <h2 style="
          margin:0 0 8px;
        ">
          自分の行をタップ
        </h2>

        <p style="
          font-size:13px;
          color:#777;
          line-height:1.6;
        ">
          「久山」さんの
          <strong>水色の行の中央</strong>
          を1回タップしてください。
          <br>
          写真が少し歪んでいても、
          横方向のマス境界を自動検出します。
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
              height:6px;
              background:#e45b5b;
              box-shadow:0 0 0 2px #fff;
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
          間違えたら、写真をもう一度タップしてください。
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

        y =
          Math.max(
            0,
            Math.min(
              img.naturalHeight - 1,
              y
            )
          );

        guide.style.display =
          "block";

        guide.style.top =
          `${
            (y /
              img.naturalHeight) *
            100
          }%`;

        read.disabled = false;

        read.style.opacity = "1";
      };

      box.querySelector("#rc")
        .onclick = () => {

          bg.remove();

          resolve();
        };

      read.onclick = async () => {

        if (y == null) return;

        read.disabled = true;

        read.textContent =
          "📖 30日分を読み取っています…";

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
            (e.message || e)
          );

          read.disabled = false;

          read.textContent =
            "この行を読み取る";
        }

        resolve();
      };
    });
  }

  /* --------------------------------
     元画像をCanvasへ
  -------------------------------- */

  function sourceCanvas(img) {

    const maxW = 3200;

    const scale =
      Math.min(
        1,
        maxW /
        img.naturalWidth
      );

    const c =
      document.createElement(
        "canvas"
      );

    c.width =
      Math.round(
        img.naturalWidth *
        scale
      );

    c.height =
      Math.round(
        img.naturalHeight *
        scale
      );

    const ctx =
      c.getContext(
        "2d",
        {
          willReadFrequently:true
        }
      );

    ctx.drawImage(
      img,
      0,
      0,
      c.width,
      c.height
    );

    return {
      canvas:c,
      scale
    };
  }

  function grayAt(
    data,
    i
  ) {

    return (
      data[i] * 299 +
      data[i + 1] * 587 +
      data[i + 2] * 114
    ) / 1000;
  }

  /* --------------------------------
     縦罫線検出
  -------------------------------- */

  function detectColumns(
    canvas,
    y
  ) {

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently:true
        }
      );

    const W = canvas.width;
    const H = canvas.height;

    const band =
      Math.max(
        25,
        Math.round(H * 0.035)
      );

    const center =
      Math.max(
        band,
        Math.min(
          H - band,
          Math.round(y)
        )
      );

    const top =
      center -
      Math.round(
        band * 0.45
      );

    const bottom =
      center +
      Math.round(
        band * 0.45
      );

    const h =
      bottom - top;

    const pixels =
      ctx.getImageData(
        0,
        top,
        W,
        h
      ).data;

    const score =
      new Float32Array(W);

    for (
      let x = 2;
      x < W - 2;
      x++
    ) {

      let s = 0;

      for (
        let yy = 0;
        yy < h;
        yy++
      ) {

        const i =
          (yy * W + x) * 4;

        const g =
          grayAt(
            pixels,
            i
          );

        const left =
          grayAt(
            pixels,
            i - 4
          );

        const right =
          grayAt(
            pixels,
            i + 4
          );

        if (
          g < 145 &&
          g < left - 10 &&
          g < right - 10
        ) {

          s++;
        }
      }

      score[x] = s;
    }

    const peaks = [];

    const minGap =
      Math.max(
        6,
        Math.round(
          W * 0.006
        )
      );

    for (
      let x = 2;
      x < W - 2;
      x++
    ) {

      if (
        score[x] <
        h * 0.15
      ) {
        continue;
      }

      if (
        score[x] >=
        score[x - 1] &&
        score[x] >=
        score[x + 1]
      ) {

        const last =
          peaks[
            peaks.length - 1
          ];

        if (
          last &&
          x - last.x <
          minGap
        ) {

          if (
            score[x] >
            last.s
          ) {

            last.x = x;
            last.s =
              score[x];
          }

        } else {

          peaks.push({
            x,
            s:score[x]
          });
        }
      }
    }

    /*
      30日分なので、

      31本の境界線

      が理想。
    */

    let best = null;

    for (
      let i = 0;
      i < peaks.length;
      i++
    ) {

      for (
        let j = i + 26;
        j < peaks.length &&
        j < i + 35;
        j++
      ) {

        const intervals =
          j - i;

        const span =
          peaks[j].x -
          peaks[i].x;

        const pitch =
          span /
          intervals;

        if (
          pitch <
            W * 0.015 ||
          pitch >
            W * 0.08
        ) {
          continue;
        }

        let good = 0;

        for (
          let k = i;
          k <= j;
          k++
        ) {

          const expected =
            peaks[i].x +
            (k - i) *
            pitch;

          if (
            Math.abs(
              peaks[k].x -
              expected
            ) <
            pitch * 0.25
          ) {

            good++;
          }
        }

        const quality =
          good /
          (intervals + 1);

        const distanceFrom30 =
          Math.abs(
            intervals - 30
          );

        const scoreValue =
          quality -
          distanceFrom30 *
          0.015;

        if (
          !best ||
          scoreValue >
          best.score
        ) {

          best = {
            start:
              peaks[i].x,

            pitch,

            intervals,

            score:
              scoreValue
          };
        }
      }
    }

    if (!best) {
      return null;
    }

    /*
      30日 × 31境界
    */

    const boundaries = [];

    for (
      let d = 0;
      d <= 30;
      d++
    ) {

      boundaries.push(
        best.start +
        d * best.pitch
      );
    }

    return {
      boundaries,
      pitch:
        best.pitch,
      left:
        boundaries[0],
      right:
        boundaries[30]
    };
  }

  /* --------------------------------
     最終保険
  -------------------------------- */

  function fallbackColumns(
    canvas
  ) {

    const left =
      canvas.width *
      0.082;

    const right =
      canvas.width *
      0.94;

    const pitch =
      (right - left) /
      30;

    const boundaries = [];

    for (
      let d = 0;
      d <= 30;
      d++
    ) {

      boundaries.push(
        left +
        d * pitch
      );
    }

    return {
      boundaries,
      pitch,
      left,
      right,
      fallback:true
    };
  }

  /* --------------------------------
     1日分を切り出す
  -------------------------------- */

  function cropCell(
    canvas,
    x1,
    x2,
    y1,
    y2
  ) {

    const width =
      x2 - x1;

    const height =
      y2 - y1;

    const padX =
      Math.max(
        2,
        Math.round(
          width * 0.12
        )
      );

    const padY =
      Math.max(
        2,
        Math.round(
          height * 0.16
        )
      );

    const sx =
      Math.max(
        0,
        Math.round(
          x1 + padX
        )
      );

    const sy =
      Math.max(
        0,
        Math.round(
          y1 + padY
        )
      );

    const sw =
      Math.max(
        8,
        Math.round(
          width -
          padX * 2
        )
      );

    const sh =
      Math.max(
        8,
        Math.round(
          height -
          padY * 2
        )
      );

    const out =
      document.createElement(
        "canvas"
      );

    out.width =
      sw * 5;

    out.height =
      sh * 5;

    const ctx =
      out.getContext(
        "2d",
        {
          willReadFrequently:true
        }
      );

    ctx.fillStyle =
      "white";

    ctx.fillRect(
      0,
      0,
      out.width,
      out.height
    );

    ctx.drawImage(
      canvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      out.width,
      out.height
    );

    return out;
  }

  /* --------------------------------
     OCR用二値化
  -------------------------------- */

  function prepareOCR(
    source
  ) {

    const c =
      document.createElement(
        "canvas"
      );

    c.width =
      source.width;

    c.height =
      source.height;

    const ctx =
      c.getContext(
        "2d",
        {
          willReadFrequently:true
        }
      );

    ctx.drawImage(
      source,
      0,
      0
    );

    const image =
      ctx.getImageData(
        0,
        0,
        c.width,
        c.height
      );

    const p =
      image.data;

    for (
      let i = 0;
      i < p.length;
      i += 4
    ) {

      const g =
        (
          p[i] * 299 +
          p[i + 1] * 587 +
          p[i + 2] * 114
        ) / 1000;

      /*
        少し甘めの閾値。
        印刷文字を残しつつ、
        水色の行背景を白に寄せる。
      */

      const v =
        g < 155
          ? 0
          : 255;

      p[i] =
        v;

      p[i + 1] =
        v;

      p[i + 2] =
        v;

      p[i + 3] =
        255;
    }

    ctx.putImageData(
      image,
      0,
      0
    );

    return c;
  }

  /* --------------------------------
     OCR結果をシフトへ変換
  -------------------------------- */

  function classify(
    text
  ) {

    let t =
      clean(text);

    t =
      t
        .replace(/Ａ/g,"A")
        .replace(/Ｂ/g,"B")
        .replace(/Ｃ/g,"C")
        .replace(/Ｄ/g,"D")
        .replace(/Ｅ/g,"E")
        .replace(/Ｈ/g,"H")
        .replace(/１/g,"1");

    if (!t) {
      return "";
    }

    /*
      C1系
    */

    if (
      /C1/.test(t) ||
      /CI/.test(t) ||
      /CL/.test(t) ||
      /G1/.test(t)
    ) {

      return "C1";
    }

    if (/A/.test(t)) {
      return "A";
    }

    if (/B/.test(t)) {
      return "B";
    }

    if (/D/.test(t)) {
      return "D";
    }

    if (/E/.test(t)) {
      return "E";
    }

    if (/H/.test(t)) {
      return "H";
    }

    if (/週|周/.test(t)) {
      return "週";
    }

    if (/振/.test(t)) {
      return "振";
    }

    if (/出/.test(t)) {
      return "出";
    }

    if (/勤/.test(t)) {
      return "勤";
    }

    if (/休/.test(t)) {
      return "休";
    }

    return "";
  }

  async function ocrCell(
    cell,
    worker
  ) {

    const prepared =
      prepareOCR(cell);

    const result =
      await worker.recognize(
        prepared
      );

    const text =
      result &&
      result.data
        ? result.data.text
        : "";

    return classify(text);
  }

  /* --------------------------------
     行を30日分読む
  -------------------------------- */

  async function readRow(
    img,
    tapY,
    year,
    month,
    button
  ) {

    await loadOCR();

    const source =
      sourceCanvas(img);

    const canvas =
      source.canvas;

    const y =
      tapY *
      source.scale;

    let columns =
      detectColumns(
        canvas,
        y
      );

    if (!columns) {
      columns =
        fallbackColumns(
          canvas
        );
    }

    const days =
      new Date(
        year,
        month,
        0
      ).getDate();

    /*
      選択行の高さ。
      写真の縦サイズに比例させる。
    */

    const rowBand =
      Math.max(
        24,
        Math.round(
          canvas.height *
          0.035
        )
      );

    const y1 =
      Math.max(
        0,
        y -
        rowBand * 0.40
      );

    const y2 =
      Math.min(
        canvas.height,
        y +
        rowBand * 0.40
      );

    const worker =
      await Tesseract.createWorker(
        "eng",
        1,
        {
          logger: message => {

            if (
              message.status ===
                "recognizing text" &&
              button
            ) {

              const percent =
                Math.round(
                  (
                    message.progress ||
                    0
                  ) * 100
                );

              button.textContent =
                `📖 ${percent}% 読み取り中…`;
            }
          }
        }
      );

    try {

      await worker.setParameters({
        tessedit_pageseg_mode:"10",

        tessedit_char_whitelist:
          "ABCDEH1CI",

        preserve_interword_spaces:
          "0"
      });

      const shifts = {};

      let detected = 0;

      for (
        let day = 1;
        day <= days;
        day++
      ) {

        const x1 =
          columns.boundaries[
            day - 1
          ];

        const x2 =
          columns.boundaries[
            day
          ];

        const cell =
          cropCell(
            canvas,
            x1,
            x2,
            y1,
            y2
          );

        const code =
          await ocrCell(
            cell,
            worker
          );

        shifts[
          dateKey(
            year,
            month,
            day
          )
        ] =
          code || "";

        if (code) {
          detected++;
        }
      }

      return {
        shifts,
        detected,
        days,
        fallback:
          !!columns.fallback
      };

    } finally {

      await worker.terminate();
    }
  }

  /* --------------------------------
     結果確認
  -------------------------------- */

  function showResult(
    result,
    year,
    month
  ) {

    const bg =
      document.createElement(
        "div"
      );

    bg.style.cssText =
      "position:fixed;" +
      "inset:0;" +
      "z-index:10000;" +
      "background:#0008;" +
      "display:flex;" +
      "align-items:center;" +
      "justify-content:center;" +
      "padding:15px;";

    const box =
      document.createElement(
        "div"
      );

    box.style.cssText =
      "background:#fffefa;" +
      "width:min(700px,100%);" +
      "max-height:94vh;" +
      "overflow:auto;" +
      "border-radius:18px;" +
      "padding:20px;";

    let html = `

      <h2 style="
        margin:0 0 8px;
      ">
        シフトを確認
      </h2>

      <p style="
        color:#777;
        line-height:1.6;
        margin-top:0;
      ">
        自動判定された結果です。
        <br>
        間違っている日は
        ここで修正できます。
      </p>

      <div style="
        padding:12px;
        background:#f4f1eb;
        border-radius:10px;
        margin-bottom:14px;
      ">

        📅 ${year}年${month}月

        <br>

        <strong>
          自動検出：
          ${result.detected}
          日 /
          ${result.days}
          日
        </strong>

        ${
          result.fallback
            ? `
              <br>
              <small>
                ※写真の傾きが強かったため、
                列位置を推定しました。
              </small>
            `
            : ""
        }

      </div>

      <div style="
        max-height:58vh;
        overflow:auto;
        padding:4px;
      ">
    `;

    for (
      let day = 1;
      day <= result.days;
      day++
    ) {

      const key =
        dateKey(
          year,
          month,
          day
        );

      const value =
        result.shifts[key] ||
        "";

      html += `

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin:6px 0;
        ">

          <strong style="
            width:55px;
          ">
            ${month}/${day}
          </strong>

          <select
            data-key="${key}"
            style="
              flex:1;
              min-height:42px;
              font-size:16px;
              border:1px solid #d0c8be;
              border-radius:8px;
              padding:4px;
            "
          >
      `;

      for (
        const code
        of SHIFT_CODES
      ) {

        html += `
          <option
            value="${code}"
            ${
              code === value
                ? "selected"
                : ""
            }
          >
            ${code || "なし"}
          </option>
        `;
      }

      html += `

          </select>

          <span
            class="status"
            style="
              width:24px;
              text-align:center;
              color:
                ${
                  value
                    ? "#5d9366"
                    : "#aaa"
                };
            "
          >
            ${
              value
                ? "✓"
                : "—"
            }
          </span>

        </div>
      `;
    }

    html += `

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
            min-height:46px;
            border:1px solid #d0c8be;
            background:white;
            border-radius:9px;
            font-size:16px;
          "
        >
          キャンセル
        </button>

        <button
          id="applyResult"
          style="
            flex:1;
            min-height:46px;
            border:0;
            background:#626960;
            color:white;
            border-radius:9px;
            font-size:16px;
            font-weight:700;
          "
        >
          カレンダーへ反映
        </button>

      </div>
    `;

    box.innerHTML =
      html;

    bg.appendChild(box);

    document.body.appendChild(
      bg
    );

    box.querySelectorAll(
      "select"
    ).forEach(select => {

      select.onchange = () => {

        const status =
          select.parentElement
            .querySelector(
              ".status"
            );

        status.textContent =
          select.value
            ? "✓"
            : "—";

        status.style.color =
          select.value
            ? "#5d9366"
            : "#aaa";
      };
    });

    box.querySelector(
      "#cancelResult"
    ).onclick = () => {

      bg.remove();
    };

    box.querySelector(
      "#applyResult"
    ).onclick = () => {

      const data =
        loadData();

      const shifts =
        data.shifts || {};

      box.querySelectorAll(
        "select"
      ).forEach(select => {

        if (select.value) {

          shifts[
            select.dataset.key
          ] =
            select.value;

        } else {

          delete shifts[
            select.dataset.key
          ];
        }
      });

      saveShifts(
        shifts
      );

      bg.remove();

      location.reload();
    };
  }

  /* --------------------------------
     起動
  -------------------------------- */

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
