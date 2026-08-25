(function () {
  "use strict";

  const VERSION = "8.1";

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

    const m =
      el &&
      el.textContent.match(
        /(\d{4})年\s*(\d{1,2})月/
      );

    if (m) {
      return {
        year: Number(m[1]),
        month: Number(m[2])
      };
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

  function loadTesseract() {
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

  function makeButton() {

    let btn =
      document.getElementById(
        "shiftImportButton"
      );

    if (!btn) {

      btn =
        document.createElement("button");

      btn.id =
        "shiftImportButton";

      btn.textContent =
        "📷 シフト表を読み込む";

      btn.style.cssText =
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
          btn,
          calendar
        );
      } else if (app) {
        app.insertBefore(
          btn,
          app.firstChild
        );
      } else {
        document.body.appendChild(btn);
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

      document.body.appendChild(input);
    }

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

      btn.disabled = true;

      btn.textContent =
        "📖 読み込み準備中…";

      try {

        const setting =
          await settingDialog(
            monthInfo()
          );

        if (setting) {
          await rowDialog(
            input.files[0],
            setting
          );
        }

      } catch (e) {

        console.error(e);

        alert(
          "シフト表を読み込めませんでした。\n\n" +
          (e.message || e)
        );

      } finally {

        btn.disabled = false;

        btn.textContent =
          "📷 シフト表を読み込む";

        input.value = "";
      }
    };
  }  function settingDialog(m){
    return new Promise(resolve=>{
      const bg=document.createElement("div");
      bg.style.cssText="position:fixed;inset:0;z-index:9999;background:#0006;display:flex;align-items:center;justify-content:center;padding:15px";

      const box=document.createElement("div");
      box.style.cssText="background:#fffefa;width:min(430px,100%);border-radius:15px;padding:20px";

      box.innerHTML=`
        <h2 style="margin:0 0 14px">シフト表を読み込む</h2>

        <p style="font-size:13px;color:#777;line-height:1.6">
          写真を選んだあと、<strong>久山さんの水色の行</strong>をタップします。<br>
          今回はその行だけを日付ごとのマスに分けて読み取ります。
        </p>

        <div style="display:flex;gap:8px">
          <input
            id="siYear"
            type="number"
            value="${m.year}"
            style="width:50%;height:44px;font-size:16px;border:1px solid #d0c8be;border-radius:8px"
          >

          <input
            id="siMonth"
            type="number"
            value="${m.month}"
            min="1"
            max="12"
            style="width:50%;height:44px;font-size:16px;border:1px solid #d0c8be;border-radius:8px"
          >
        </div>

        <div style="margin-top:14px;padding:10px;background:#f4f1eb;border-radius:8px;font-size:12px">
          読み込む月：
          <strong>${m.year}年${m.month}月</strong>
        </div>

        <div style="display:flex;gap:8px;margin-top:15px">
          <button
            id="sic"
            style="flex:1;min-height:42px;border:1px solid #d0c8be;background:white;border-radius:8px"
          >
            キャンセル
          </button>

          <button
            id="sio"
            style="flex:1;min-height:42px;border:0;background:#626960;color:white;border-radius:8px"
          >
            写真を選ぶ
          </button>
        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      box.querySelector("#sic").onclick=()=>{
        bg.remove();
        resolve(null);
      };

      box.querySelector("#sio").onclick=()=>{
        const year=
          +box.querySelector("#siYear").value;

        const month=
          +box.querySelector("#siMonth").value;

        if(
          !year ||
          month<1 ||
          month>12
        ){
          alert("年月を確認してください。");
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

  async function rowDialog(file,setting,button){

    const img=
      await loadImage(file);

    return new Promise(resolve=>{

      const bg=
        document.createElement("div");

      bg.style.cssText=
        "position:fixed;inset:0;z-index:9999;" +
        "background:#0008;display:flex;" +
        "align-items:center;justify-content:center;" +
        "padding:10px";

      const box=
        document.createElement("div");

      box.style.cssText=
        "width:min(900px,100%);" +
        "max-height:96vh;overflow:auto;" +
        "background:#fffefa;border-radius:15px;" +
        "padding:15px";

      box.innerHTML=`
        <h2 style="margin:0 0 8px">
          自分の行をタップ
        </h2>

        <p style="font-size:13px;color:#777;line-height:1.6">
          <strong>久山さんの水色の行の中央</strong>
          を1回タップしてください。<br>
          その行だけを日付ごとのマスに分割して読み取ります。
        </p>

        <div
          id="photoBox"
          style="position:relative;width:100%;overflow:auto;background:#eee;border-radius:8px"
        >
          <img
            id="shiftPhoto"
            style="display:block;width:100%;height:auto"
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
              pointer-events:none
            "
          ></div>
        </div>

        <p style="font-size:12px;color:#777;margin:9px 0">
          赤い線が選択した行です。
          間違えたら写真をもう一度タップしてください。
        </p>

        <div style="display:flex;gap:8px">

          <button
            id="rc"
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
            id="rr"
            disabled
            style="
              flex:1;
              min-height:42px;
              border:0;
              background:#626960;
              color:white;
              border-radius:8px;
              opacity:.45
            "
          >
            この行を読み取る
          </button>

        </div>
      `;

      bg.appendChild(box);
      document.body.appendChild(bg);

      const photo=
        box.querySelector("#shiftPhoto");

      const guide=
        box.querySelector("#guide");

      const read=
        box.querySelector("#rr");

      photo.src=
        URL.createObjectURL(file);

      let y=null;

      photo.onclick=e=>{

        const r=
          photo.getBoundingClientRect();

        y=
          (e.clientY-r.top) *
          (img.naturalHeight/r.height);

        y=
          Math.max(
            0,
            Math.min(
              img.naturalHeight-1,
              y
            )
          );

        guide.style.display="block";

        guide.style.top=
          `${y/img.naturalHeight*100}%`;

        read.disabled=false;
        read.style.opacity="1";
      };

      box.querySelector("#rc").onclick=()=>{
        bg.remove();
        resolve();
      };

      read.onclick=async()=>{

        if(y==null)return;

        read.disabled=true;

        read.textContent=
          "📖 日付ごとのマスを読み取っています…";

        try{

          const result=
            await readRow(
              img,
              y,
              setting.year,
              setting.month
            );

          bg.remove();

          showResult(
            result,
            setting.year,
            setting.month
          );

        }catch(e){

          console.error(e);

          alert(
            "読み取りに失敗しました。\n\n" +
            (e.message||e)
          );

          read.disabled=false;

          read.textContent=
            "この行を読み取る";
        }

        resolve();
      };
    });
  }  function makeCanvas(img, maxW = 2600) {

    const scale =
      Math.min(
        1,
        maxW / img.naturalWidth
      );

    const c =
      document.createElement("canvas");

    c.width =
      Math.round(
        img.naturalWidth * scale
      );

    c.height =
      Math.round(
        img.naturalHeight * scale
      );

    const ctx =
      c.getContext(
        "2d",
        { willReadFrequently:true }
      );

    ctx.drawImage(
      img,
      0,
      0,
      c.width,
      c.height
    );

    return {
      c,
      scale
    };
  }


  function verticalScore(
    ctx,
    x,
    y0,
    y1
  ) {

    const W =
      ctx.canvas.width;

    x =
      Math.max(
        0,
        Math.min(
          W - 1,
          Math.round(x)
        )
      );

    const h =
      Math.max(
        1,
        y1 - y0
      );

    const data =
      ctx.getImageData(
        Math.max(0, x - 1),
        y0,
        Math.min(3, W - x + 1),
        h
      ).data;

    let sum = 0;
    let count = 0;

    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      const gray =
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114;

      sum += 255 - gray;
      count++;
    }

    return count
      ? sum / count
      : 0;
  }


  function detectColumns(
    canvas,
    y,
    days
  ) {

    const ctx =
      canvas.getContext(
        "2d",
        { willReadFrequently:true }
      );

    const W =
      canvas.width;

    const H =
      canvas.height;

    /*
     * 選択された行の周辺だけを見る。
     * ここでは文字そのものより、
     * 表の縦罫線を優先して探す。
     */

    const band =
      Math.max(
        18,
        Math.round(H * 0.014)
      );

    const y0 =
      Math.max(
        0,
        Math.round(y - band)
      );

    const y1 =
      Math.min(
        H,
        Math.round(y + band)
      );

    const raw = [];

    for (
      let x = 0;
      x < W;
      x++
    ) {

      raw[x] =
        verticalScore(
          ctx,
          x,
          y0,
          y1
        );
    }


    /*
     * 少し平滑化して、
     * 文字による細かいピークを減らす。
     */

    const smooth =
      raw.map((v, i) => {

        let sum = 0;
        let count = 0;

        for (
          let k = -3;
          k <= 3;
          k++
        ) {

          const q = i + k;

          if (
            q >= 0 &&
            q < W
          ) {

            sum += raw[q];
            count++;
          }
        }

        return sum / count;
      });


    /*
     * 表の「日付欄」は、
     * 写真全体のだいたい
     * 6〜94%の範囲にある。
     *
     * 左側には職員名、
     * 右側にも職員名があるので、
     * その外側を除外する。
     */

    const leftStart =
      Math.round(W * 0.06);

    const leftEnd =
      Math.round(W * 0.20);

    const rightStart =
      Math.round(W * 0.80);

    const rightEnd =
      Math.round(W * 0.94);


    function findBorder(
      from,
      to,
      direction
    ) {

      let best = -1;
      let bestScore = 0;

      if (direction > 0) {

        for (
          let x = from;
          x <= to;
          x++
        ) {

          if (
            smooth[x] >
            bestScore
          ) {

            bestScore =
              smooth[x];

            best = x;
          }
        }

      } else {

        for (
          let x = to;
          x >= from;
          x--
        ) {

          if (
            smooth[x] >
            bestScore
          ) {

            bestScore =
              smooth[x];

            best = x;
          }
        }
      }

      return {
        x: best,
        score: bestScore
      };
    }


    const left =
      findBorder(
        leftStart,
        leftEnd,
        1
      );

    const right =
      findBorder(
        rightStart,
        rightEnd,
        -1
      );


    /*
     * 罫線が弱い写真でも、
     * ある程度まで許容する。
     */

    if (
      left.x < 0 ||
      right.x < 0 ||
      right.x <= left.x
    ) {

      throw new Error(
        "日付欄の位置を検出できませんでした。"
      );
    }


    const x0 =
      left.x;

    const x30 =
      right.x;

    const width =
      x30 - x0;


    /*
     * 30日なら30分割。
     * 31日なら31分割。
     * 28日・29日も同じ考え方。
     */

    const bounds = [];

    for (
      let i = 0;
      i <= days;
      i++
    ) {

      bounds.push(
        Math.round(
          x0 +
          width * i / days
        )
      );
    }


    /*
     * 写真の歪みで罫線が
     *多少ずれていても、
     *各マスを均等に分割する。
     *
     * これが今回の重要部分。
     */

    const gaps =
      bounds
        .slice(1)
        .map(
          (v, i) =>
            v - bounds[i]
        );

    const sorted =
      gaps
        .slice()
        .sort(
          (a, b) =>
            a - b
        );

    const median =
      sorted[
        Math.floor(
          sorted.length / 2
        )
      ];


    if (
      !median ||
      median < 15 ||
      median > 100
    ) {

      throw new Error(
        "日付マスの幅を正しく判断できませんでした。"
      );
    }


    return bounds;
  }


  function cellImage(
    canvas,
    x0,
    x1,
    y
  ) {

    const ctx =
      canvas.getContext(
        "2d",
        { willReadFrequently:true }
      );

    const H =
      canvas.height;

    /*
     * 選択した行の中央付近だけを
     *切り出す。
     *
     * 上下の罫線をできるだけ
     * OCRに入れない。
     */

    const rowHeight =
      Math.max(
        30,
        Math.round(
          H * 0.025
        )
      );

    const top =
      Math.max(
        0,
        Math.round(
          y -
          rowHeight * 0.42
        )
      );

    const bottom =
      Math.min(
        H,
        Math.round(
          y +
          rowHeight * 0.42
        )
      );


    /*
     * 左右の縦罫線も
     * OCRに入れない。
     */

    const cellWidth =
      x1 - x0;

    const pad =
      Math.max(
        3,
        Math.round(
          cellWidth * 0.13
        )
      );

    const sx =
      x0 + pad;

    const sw =
      Math.max(
        5,
        cellWidth - pad * 2
      );

    const sh =
      Math.max(
        10,
        bottom - top
      );


    /*
     * OCRしやすいように
     *5倍に拡大する。
     */

    const c =
      document.createElement(
        "canvas"
      );

    c.width =
      sw * 5;

    c.height =
      sh * 5;

    const g =
      c.getContext(
        "2d",
        { willReadFrequently:true }
      );

    g.fillStyle =
      "#ffffff";

    g.fillRect(
      0,
      0,
      c.width,
      c.height
    );

    g.drawImage(
      canvas,
      sx,
      top,
      sw,
      sh,
      0,
      0,
      c.width,
      c.height
    );

    return c;
  }


  function cellStats(c) {

    const ctx =
      c.getContext(
        "2d",
        { willReadFrequently:true }
      );

    const data =
      ctx.getImageData(
        0,
        0,
        c.width,
        c.height
      ).data;

    let sum = 0;
    let count = 0;
    let dark = 0;

    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      const gray =
        data[i] * 0.299 +
        data[i + 1] * 0.587 +
        data[i + 2] * 0.114;

      sum += gray;
      count++;

      if (
        gray < 110
      ) {
        dark++;
      }
    }

    return {
      mean:
        count
          ? sum / count
          : 255,

      dark
    };
  }  async function recognizeCell(
    worker,
    canvas
  ) {

    const stats =
      cellStats(canvas);

    /*
     * ほぼ真っ白なセルは
     * OCRしない。
     *
     * これで「なし」の日を
     * 無理に文字として拾うのを減らす。
     */

    if (
      stats.mean > 247 ||
      stats.dark < 18
    ) {
      return "";
    }


    const result =
      await worker.recognize(
        canvas
      );

    let text =
      result.data.text
        .toUpperCase()
        .replace(/\s/g, "")
        .replace(/[|｜]/g, "I")
        .trim();

    /*
     * OCRの誤認識をある程度補正。
     */

    text =
      text
        .replace(/Ｃ/g, "C")
        .replace(/Ａ/g, "A")
        .replace(/Ｂ/g, "B")
        .replace(/Ｅ/g, "E")
        .replace(/Ｈ/g, "H")
        .replace(/Ｄ/g, "D")
        .replace(/１/g, "1")
        .replace(/０/g, "0");


    /*
     * C1は特に誤認識されやすいので、
     * C + 1 の組み合わせを優先。
     */

    if (
      /C[IL1]/.test(text) ||
      /[CG]1/.test(text)
    ) {
      return "C1";
    }


    /*
     * よくあるOCR誤りを補正。
     */

    const fixes = {

      "A": "A",

      "4": "A",
      "@": "A",

      "B": "B",
      "8": "B",

      "E": "E",
      "F": "E",

      "H": "H",
      "N": "H",

      "D": "D",
      "0": "D"
    };


    /*
     * 最初に完全一致を確認。
     */

    for (
      const code of
      ["A","B","C1","D","E","H"]
    ) {

      if (
        text === code
      ) {
        return code;
      }
    }


    /*
     * 文字列の中に
     * シフト記号らしいものが
     * 1個だけ入っている場合。
     */

    if (
      text.length <= 3
    ) {

      if (
        /C[IL1]/.test(text)
      ) {
        return "C1";
      }

      for (
        const code of
        ["A","B","D","E","H"]
      ) {

        if (
          text.includes(code)
        ) {
          return code;
        }
      }

      /*
       * 数字OCRの補正。
       */

      if (
        text === "4"
      ) {
        return "A";
      }

      if (
        text === "8"
      ) {
        return "B";
      }
    }


    return "";
  }


  async function recognizeJapaneseCell(
    worker,
    canvas
  ) {

    const stats =
      cellStats(canvas);

    if (
      stats.mean > 247 ||
      stats.dark < 18
    ) {
      return "";
    }

    try {

      const result =
        await worker.recognize(
          canvas
        );

      let text =
        result.data.text
          .replace(/\s/g, "")
          .trim();

      /*
       * 日本語OCRで拾いたいのは
       * 主に以下の記号。
       */

      if (
        text.includes("週")
      ) {
        return "週";
      }

      if (
        text.includes("振")
      ) {
        return "振";
      }

      if (
        text.includes("出")
      ) {
        return "出";
      }

      if (
        text.includes("勤")
      ) {
        return "勤";
      }

      if (
        text.includes("休")
      ) {
        return "休";
      }

    } catch (e) {

      console.warn(
        "日本語OCR失敗",
        e
      );
    }

    return "";
  }


  async function createWorker(){

    await loadTesseract();

    /*
     * 英字シフトを読むための
     * English worker。
     */

    const worker =
      await Tesseract.createWorker(
        "eng"
      );

    await worker.setParameters({

      tessedit_pageseg_mode:
        Tesseract.PSM.SINGLE_WORD,

      preserve_interword_spaces:
        "0"

    });

    return worker;
  }


  async function createJapaneseWorker(){

    await loadTesseract();

    try {

      const worker =
        await Tesseract.createWorker(
          "jpn"
        );

      await worker.setParameters({

        tessedit_pageseg_mode:
          Tesseract.PSM.SINGLE_WORD,

        preserve_interword_spaces:
          "0"

      });

      return worker;

    } catch (e) {

      console.warn(
        "日本語OCRを読み込めませんでした",
        e
      );

      return null;
    }
  }


  function normalizeShift(
    value
  ) {

    if (!value) {
      return "";
    }

    value =
      String(value)
        .trim()
        .toUpperCase();


    if (
      SHIFT_CODES.includes(value)
    ) {
      return value;
    }


    /*
     * OCR結果の最終補正。
     */

    if (
      value === "CI" ||
      value === "CL" ||
      value === "C1"
    ) {
      return "C1";
    }

    if (
      value === "4"
    ) {
      return "A";
    }

    if (
      value === "8"
    ) {
      return "B";
    }

    if (
      value === "F"
    ) {
      return "E";
    }

    if (
      value === "N"
    ) {
      return "H";
    }

    return "";
  }


  async function readRow(
    img,
    y,
    year,
    month
  ) {

    /*
     * 写真を大きめのキャンバスに
     * 変換。
     */

    const made =
      makeCanvas(
        img,
        2800
      );

    const canvas =
      made.c;

    const scale =
      made.scale;

    const scaledY =
      y * scale;


    /*
     * 月の日数。
     */

    const days =
      new Date(
        year,
        month,
        0
      ).getDate();


    /*
     * まず日付欄の縦線を検出。
     */

    const bounds =
      detectColumns(
        canvas,
        scaledY,
        days
      );


    const worker =
      await createWorker();


    /*
     * 日本語workerは、
     * 最初から全部のセルに使わない。
     *
     * A/B/E/Hなどが読めなかった
     * セルだけに使う。
     */

    let jpWorker = null;

    const shifts = {};


    try {

      for (
        let day = 1;
        day <= days;
        day++
      ) {

        const x0 =
          bounds[day - 1];

        const x1 =
          bounds[day];


        const cell =
          cellImage(
            canvas,
            x0,
            x1,
            scaledY
          );


        /*
         * まず英字OCR。
         */

        let value =
          await recognizeCell(
            worker,
            cell
          );


        value =
          normalizeShift(
            value
          );


        /*
         * 英字として読めなかった場合だけ、
         * 日本語OCRを試す。
         */

        if (
          !value
        ) {

          if (!jpWorker) {
            jpWorker =
              await createJapaneseWorker();
          }

          if (jpWorker) {

            value =
              await recognizeJapaneseCell(
                jpWorker,
                cell
              );

            value =
              normalizeShift(
                value
              );
          }
        }


        const k =
          dateKey(
            year,
            month,
            day
          );


        if (value) {
          shifts[k] = value;
        }


        /*
         * 進捗表示。
         */

        updateProgress(
          day,
          days
        );
      }

    } finally {

      try {
        await worker.terminate();
      } catch (e) {}

      if (jpWorker) {

        try {
          await jpWorker.terminate();
        } catch (e) {}

      }
    }


    return {
      shifts,
      days
    };
  }


  function updateProgress(
    day,
    days
  ) {

    const el =
      document.getElementById(
        "shiftImportProgress"
      );

    if (!el) {
      return;
    }

    el.textContent =
      `📖 ${day} / ${days} 日を解析中…`;
  }  function showResult(
    result,
    year,
    month
  ) {

    const bg =
      document.createElement("div");

    bg.style.cssText =
      "position:fixed;inset:0;z-index:10000;" +
      "background:#0008;display:flex;" +
      "align-items:center;justify-content:center;" +
      "padding:15px";

    const box =
      document.createElement("div");

    box.style.cssText =
      "background:#fffefa;" +
      "width:min(700px,100%);" +
      "max-height:94vh;" +
      "overflow:auto;" +
      "border-radius:18px;" +
      "padding:20px";

    const detected =
      Object.keys(
        result.shifts || {}
      ).length;


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
        自動判定された結果です。<br>
        間違っている日はここで修正できます。
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
          ${detected}日 /
          ${result.days}日
        </strong>

      </div>

      <div style="
        max-height:58vh;
        overflow:auto;
        padding:4px;
      ">
    `;


    /*
     * その月の日数分を
     * 必ず全部表示する。
     *
     * OCRできなかった日も
     * 「なし」として表示するので、
     * 途中の日が消えることはない。
     */

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
        result.shifts[key] || "";


      html += `

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
          margin:6px 0;
        ">

          <strong style="
            width:55px;
            flex:0 0 55px;
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
              background:white;
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
              flex:0 0 24px;
              text-align:center;
              color:${
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


    /*
     * プルダウンを変更したとき、
     * ✓ / — も更新する。
     */

    box.querySelectorAll(
      "select"
    ).forEach(select => {

      select.onchange = () => {

        const status =
          select.parentElement
            .querySelector(
              ".status"
            );

        if (!status) {
          return;
        }

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


    /*
     * 反映ボタン。
     *
     * ここで初めて
     * localStorageへ保存する。
     *
     * つまり、確認画面の段階では
     * カレンダーにはまだ反映されない。
     */

    box.querySelector(
      "#applyResult"
    ).onclick = () => {

      const data =
        loadData();

      const shifts =
        data.shifts || {};


      box.querySelectorAll(
        "select[data-key]"
      ).forEach(select => {

        const key =
          select.dataset.key;

        const value =
          select.value;


        if (value) {

          shifts[key] =
            value;

        } else {

          delete shifts[key];
        }
      });


      saveShifts(
        shifts
      );


      bg.remove();


      /*
       * カレンダーを再描画。
       * reloadではなく、
       * 今のアプリのrender()を使えるよう
       * まず安全にreloadする。
       */

      location.reload();
    };
  }


  function init() {

    /*
     * 既にボタンがHTML側にある場合も、
     * JS側で二重に作らない。
     */

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
