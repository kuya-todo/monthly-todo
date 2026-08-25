(function () {
  "use strict";

  const VERSION = "9.0";

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
    "休",
    "?"
  ];

  const pad = n =>
    String(n).padStart(2, "0");

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

  function getMonthInfo() {

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

  function makeButton() {
  const app = document.querySelector(".app");
  const calendar = document.querySelector(".calendar");

  let wrap = document.getElementById("shiftActionButtons");

  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "shiftActionButtons";
    wrap.style.cssText = [
      "display:flex",
      "gap:8px",
      "width:100%",
      "margin:10px 0",
      "box-sizing:border-box"
    ].join(";");

    const sendBtn = document.createElement("button");
    sendBtn.id = "shiftImportButton";
    sendBtn.textContent = "📤 シフト送信";
    sendBtn.style.cssText = [
      "flex:1",
      "min-width:0",
      "padding:12px 6px",
      "border:1px solid #d0c8be",
      "border-radius:10px",
      "background:#fffefa",
      "color:#403b36",
      "font-size:15px",
      "font-weight:700",
      "box-sizing:border-box"
    ].join(";");

    const pasteBtn = document.createElement("button");
    pasteBtn.id = "shiftPasteButton";
    pasteBtn.textContent = "📋 結果を貼る";
    pasteBtn.style.cssText = [
      "flex:1",
      "min-width:0",
      "padding:12px 6px",
      "border:1px solid #d0c8be",
      "border-radius:10px",
      "background:#fffefa",
      "color:#403b36",
      "font-size:15px",
      "font-weight:700",
      "box-sizing:border-box"
    ].join(";");

    wrap.appendChild(sendBtn);
    wrap.appendChild(pasteBtn);

    if (app && calendar) {
      app.insertBefore(wrap, calendar);
    } else if (app) {
      app.insertBefore(wrap, app.firstChild);
    } else {
      document.body.appendChild(wrap);
    }

    sendBtn.onclick = () => {
      const url =
        "shortcuts://run-shortcut?name=" +
        encodeURIComponent("シフト表をChatGPTへ送る");

      window.location.href = url;
    };

    pasteBtn.onclick = () => {
      openPasteScreen(getMonthInfo());
    };
  }
}

    let input =
      document.getElementById(
        "shiftImportInput"
      );

    if (!input) {

      input =
        document.createElement(
          "input"
        );

      input.id =
        "shiftImportInput";

      input.type =
        "file";

      input.accept =
        "image/*";

      input.style.display =
        "none";

      document.body.appendChild(
        input
      );
    }

btn.onclick = () => {
  const url =
    "shortcuts://run-shortcut?name=" +
    encodeURIComponent("シフト表をChatGPTへ送る");

  window.location.href = url;
};

    input.onchange = () => {

      if (
        !input.files ||
        !input.files[0]
      ) {
        return;
      }

      openSendScreen(
        input.files[0],
        getMonthInfo()
      );

      input.value = "";
    };
  }

  function openSendScreen(
    file,
    monthInfo
  ) {

    const bg =
      document.createElement(
        "div"
      );

    bg.style.cssText =
      [
        "position:fixed",
        "inset:0",
        "z-index:9999",
        "background:#0008",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:15px",
        "box-sizing:border-box"
      ].join(";");

    const box =
      document.createElement(
        "div"
      );

    box.style.cssText =
      [
        "background:#fffefa",
        "width:min(700px,100%)",
        "max-height:94vh",
        "overflow:auto",
        "border-radius:18px",
        "padding:20px",
        "box-sizing:border-box"
      ].join(";");

    box.innerHTML = `

      <h2 style="
        margin:0 0 10px;
      ">
        🤖 ChatGPTでシフトを読み取る
      </h2>

      <p style="
        color:#666;
        line-height:1.7;
        font-size:14px;
      ">
        写真をChatGPTに渡して、
        <strong>久山さんの水色の行</strong>
        を読み取ります。
      </p>

      <div style="
        background:#f4f1eb;
        border-radius:10px;
        padding:12px;
        margin:12px 0;
        font-size:13px;
        line-height:1.7;
      ">

        📅 ${monthInfo.year}年${monthInfo.month}月

        <br>

        <strong>
          読み取り対象：
          1日〜${new Date(
            monthInfo.year,
            monthInfo.month,
            0
          ).getDate()}日
        </strong>

      </div>

      <img
        id="shiftPreview"
        style="
          width:100%;
          max-height:300px;
          object-fit:contain;
          border-radius:8px;
          background:#eee;
          margin-bottom:12px;
        "
      >

      <button
        id="sendChatGPT"
        style="
          width:100%;
          min-height:50px;
          border:0;
          border-radius:10px;
          background:#626960;
          color:white;
          font-size:16px;
          font-weight:700;
        "
      >
        🤖 ChatGPTへ送る
      </button>

      <button
        id="pasteResult"
        style="
          width:100%;
          min-height:46px;
          margin-top:9px;
          border:1px solid #d0c8be;
          border-radius:10px;
          background:white;
          color:#403b36;
          font-size:15px;
          font-weight:700;
        "
      >
        📋 ChatGPTの結果を貼り付ける
      </button>

      <button
        id="closeShiftAI"
        style="
          width:100%;
          min-height:42px;
          margin-top:9px;
          border:0;
          background:transparent;
          color:#777;
          font-size:14px;
        "
      >
        閉じる
      </button>

    `;

    bg.appendChild(box);

    document.body.appendChild(bg);

    const preview =
      box.querySelector(
        "#shiftPreview"
      );

    preview.src =
      URL.createObjectURL(file);

    box.querySelector(
      "#closeShiftAI"
    ).onclick = () => {
      bg.remove();
    };

    box.querySelector(
      "#sendChatGPT"
    ).onclick = async () => {

      await sendToChatGPT(
        file,
        monthInfo
      );
    };

    box.querySelector(
      "#pasteResult"
    ).onclick = () => {

      openPasteScreen(
        monthInfo
      );
    };
  }

  function makePrompt(info) {

    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    return `
この画像は保育園の職員シフト表です。

${info.year}年${info.month}月のシフトを読み取ってください。

重要：
・「久山」の名前がある行を探してください。
・久山の行は水色で色付けされています。
・久山の行だけを読み取ってください。
・他の職員のシフトは絶対に混ぜないでください。
・日付とシフトの対応を正確に確認してください。
・写真が歪んでいても、表の位置関係から判断してください。
・読めない日は推測せず「?」にしてください。
・空欄や休日は「なし」としてください。

使用するシフト：
A
B
C1
D
E
H
週
振
出
勤
休
なし
?

必ず${days}日分すべてを出してください。

回答は説明文を付けず、
次の形式だけで返してください。

${info.year}-${pad(info.month)}-01=A
${info.year}-${pad(info.month)}-02=なし
${info.year}-${pad(info.month)}-03=H

以下${days}日まで続けてください。
`.trim();
  }

  async function sendToChatGPT(
    file,
    info
  ) {

    const prompt =
      makePrompt(info);

    try {

      const shareData = {

        files: [file],

        title:
          "Monthly Todo シフト表",

        text: prompt
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(
          shareData
        )
      ) {

        await navigator.share(
          shareData
        );

        return;
      }

    } catch (e) {

      if (
        e &&
        e.name === "AbortError"
      ) {
        return;
      }

      console.warn(
        "Web Share failed",
        e
      );
    }


    /*
     * 共有機能が使えない場合は、
     * ChatGPTへ渡す指示文を表示。
     */

    openPromptScreen(
      prompt
    );
  }

  function openPromptScreen(
    prompt
  ) {

    const bg =
      document.createElement(
        "div"
      );

    bg.style.cssText =
      [
        "position:fixed",
        "inset:0",
        "z-index:10001",
        "background:#0008",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:15px"
      ].join(";");

    const box =
      document.createElement(
        "div"
      );

    box.style.cssText =
      [
        "background:#fffefa",
        "width:min(600px,100%)",
        "max-height:90vh",
        "overflow:auto",
        "border-radius:18px",
        "padding:20px"
      ].join(";");

    box.innerHTML = `

      <h3>
        ChatGPTに渡す指示
      </h3>

      <p style="
        font-size:13px;
        color:#777;
        line-height:1.6;
      ">
        下の文章をコピーして、
        写真と一緒にChatGPTへ送ってください。
      </p>

      <textarea
        id="aiPrompt"
        style="
          width:100%;
          height:320px;
          box-sizing:border-box;
          border:1px solid #ccc;
          border-radius:8px;
          padding:10px;
          font-size:13px;
          line-height:1.5;
        "
      ></textarea>

      <button
        id="copyPrompt"
        style="
          width:100%;
          min-height:46px;
          margin-top:10px;
          border:0;
          border-radius:9px;
          background:#626960;
          color:white;
          font-size:15px;
          font-weight:700;
        "
      >
        📋 指示をコピー
      </button>

      <button
        id="closePrompt"
        style="
          width:100%;
          min-height:42px;
          margin-top:7px;
          border:0;
          background:transparent;
          color:#777;
        "
      >
        閉じる
      </button>
    `;

    bg.appendChild(box);

    document.body.appendChild(bg);

    const ta =
      box.querySelector(
        "#aiPrompt"
      );

    ta.value =
      prompt;

    box.querySelector(
      "#copyPrompt"
    ).onclick = async () => {

      await navigator.clipboard.writeText(
        prompt
      );

      alert(
        "指示文をコピーしました。"
      );
    };

    box.querySelector(
      "#closePrompt"
    ).onclick = () => {
      bg.remove();
    };
  }

  function openPasteScreen(
    info
  ) {

    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    const bg =
      document.createElement(
        "div"
      );

    bg.style.cssText =
      [
        "position:fixed",
        "inset:0",
        "z-index:10002",
        "background:#0008",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:15px"
      ].join(";");

    const box =
      document.createElement(
        "div"
      );

    box.style.cssText =
      [
        "background:#fffefa",
        "width:min(650px,100%)",
        "max-height:94vh",
        "overflow:auto",
        "border-radius:18px",
        "padding:20px"
      ].join(";");

    box.innerHTML = `

      <h2 style="
        margin:0 0 8px;
      ">
        📋 ChatGPTの結果を貼り付け
      </h2>

      <p style="
        color:#777;
        font-size:13px;
        line-height:1.6;
      ">
        ChatGPTが返した
        「YYYY-MM-DD=シフト」
        の一覧を、そのまま貼り付けてください。
      </p>

      <textarea
        id="aiResultText"
        placeholder="
2026-09-01=A
2026-09-02=H
2026-09-03=なし
…
        "
        style="
          width:100%;
          height:300px;
          box-sizing:border-box;
          border:1px solid #ccc;
          border-radius:9px;
          padding:10px;
          font-size:14px;
          line-height:1.5;
        "
      ></textarea>

      <button
        id="parseAI"
        style="
          width:100%;
          min-height:48px;
          margin-top:10px;
          border:0;
          border-radius:9px;
          background:#626960;
          color:white;
          font-size:16px;
          font-weight:700;
        "
      >
        シフトを確認する
      </button>

      <button
        id="cancelAI"
        style="
          width:100%;
          min-height:42px;
          margin-top:7px;
          border:0;
          background:transparent;
          color:#777;
        "
      >
        キャンセル
      </button>
    `;

    bg.appendChild(box);

    document.body.appendChild(bg);

    box.querySelector(
      "#cancelAI"
    ).onclick = () => {
      bg.remove();
    };

    box.querySelector(
      "#parseAI"
    ).onclick = () => {

      const text =
        box.querySelector(
          "#aiResultText"
        ).value;

      const result =
        parseAIResult(
          text,
          info
        );

      if (
        result.error
      ) {

        alert(
          result.error
        );

        return;
      }

      bg.remove();

      showResult(
        result.shifts,
        info
      );
    };
  }

  function parseAIResult(
    text,
    info
  ) {

    const shifts = {};

    const lines =
      String(text || "")
        .split(/\r?\n/)
        .map(
          x => x.trim()
        )
        .filter(Boolean);

    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    let count = 0;

    for (
      const line of lines
    ) {

      const match =
        line.match(
          /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s*[=:：]\s*(.+)/
        );

      if (!match) {
        continue;
      }

      const y =
        Number(match[1]);

      const m =
        Number(match[2]);

      const d =
        Number(match[3]);

      if (
        y !== info.year ||
        m !== info.month ||
        d < 1 ||
        d > days
      ) {
        continue;
      }

      let value =
        match[4]
          .trim()
          .replace(
            /（.*?）/g,
            ""
          )
          .trim();

      value =
        normalizeValue(
          value
        );

      shifts[
        dateKey(
          y,
          m,
          d
        )
      ] = value;

      count++;
    }

    if (!count) {

      return {
        error:
          "ChatGPTの結果を読み取れませんでした。\n\n" +
          "「2026-09-01=A」のような形式になっているか確認してください。"
      };
    }

    return {
      shifts
    };
  }

  function normalizeValue(
    value
  ) {

    if (!value) {
      return "?";
    }

    value =
      value
        .trim()
        .toUpperCase();

    if (
      value === "なし" ||
      value === "無し" ||
      value === "-" ||
      value === "－" ||
      value === "休み" ||
      value === "休日" ||
      value === "空欄"
    ) {
      return "";
    }

    if (
      value === "?" ||
      value === "？" ||
      value === "不明" ||
      value === "判読不能"
    ) {
      return "?";
    }

    if (
      value === "C1" ||
      value === "Ｃ１"
    ) {
      return "C1";
    }

    if (
      [
        "A",
        "B",
        "D",
        "E",
        "H",
        "週",
        "振",
        "出",
        "勤",
        "休"
      ].includes(value)
    ) {
      return value;
    }

    return "?";
  }

  function showResult(
    shifts,
    info
  ) {

    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    const bg =
      document.createElement(
        "div"
      );

    bg.style.cssText =
      [
        "position:fixed",
        "inset:0",
        "z-index:10003",
        "background:#0008",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:15px"
      ].join(";");

    const box =
      document.createElement(
        "div"
      );

    box.style.cssText =
      [
        "background:#fffefa",
        "width:min(700px,100%)",
        "max-height:94vh",
        "overflow:auto",
        "border-radius:18px",
        "padding:20px"
      ].join(";");

    const detected =
      Object.values(
        shifts
      ).filter(
        x => x !== ""
      ).length;

    const unknown =
      Object.values(
        shifts
      ).filter(
        x => x === "?"
      ).length;

    let html = `

      <h2 style="
        margin:0 0 8px;
      ">
        シフトを確認
      </h2>

      <div style="
        padding:12px;
        background:#f4f1eb;
        border-radius:10px;
        margin-bottom:12px;
        line-height:1.7;
      ">

        📅 ${info.year}年${info.month}月

        <br>

        読み取り：
        <strong>
          ${detected}日
        </strong>

        ${
          unknown
            ? `
              <br>
              ⚠️ 要確認：
              <strong>
                ${unknown}日
              </strong>
            `
            : ""
        }

      </div>

      <div style="
        max-height:58vh;
        overflow:auto;
      ">
    `;

    for (
      let day = 1;
      day <= days;
      day++
    ) {

      const key =
        dateKey(
          info.year,
          info.month,
          day
        );

      const value =
        shifts[key] ?? "";

      const isUnknown =
        value === "?";

      html += `

        <div style="
          display:flex;
          align-items:center;
          gap:9px;
          margin:6px 0;
        ">

          <strong style="
            width:55px;
            flex:0 0 55px;
          ">
            ${info.month}/${day}
          </strong>

          <select
            data-key="${key}"
            style="
              flex:1;
              min-height:42px;
              font-size:16px;
              border:1px solid ${
                isUnknown
                  ? "#d99"
                  : "#d0c8be"
              };
              border-radius:8px;
              padding:4px;
              background:${
                isUnknown
                  ? "#fff3f3"
                  : "white"
              };
            "
          >
      `;

      for (
        const code of
        SHIFT_CODES
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
            ${
              code === ""
                ? "なし"
                : code
            }
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
              color:${
                isUnknown
                  ? "#c44"
                  : value
                    ? "#5d9366"
                    : "#aaa"
              };
            "
          >
            ${
              isUnknown
                ? "⚠️"
                : value
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
          id="cancelAIResult"
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
          id="applyAIResult"
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

    document.body.appendChild(bg);

    box.querySelectorAll(
      "select"
    ).forEach(select => {

      select.onchange = () => {

        const status =
          select.parentElement
            .querySelector(
              ".status"
            );

        const unknown =
          select.value === "?";

        status.textContent =
          unknown
            ? "⚠️"
            : select.value
              ? "✓"
              : "—";

        status.style.color =
          unknown
            ? "#c44"
            : select.value
              ? "#5d9366"
              : "#aaa";
      };
    });

    box.querySelector(
      "#cancelAIResult"
    ).onclick = () => {
      bg.remove();
    };

    box.querySelector(
      "#applyAIResult"
    ).onclick = () => {

      const data =
        loadData();

      const current =
        data.shifts || {};

      box.querySelectorAll(
        "select[data-key]"
      ).forEach(select => {

        const key =
          select.dataset.key;

        const value =
          select.value;

        if (
          value &&
          value !== "?"
        ) {

          current[key] =
            value;

        } else if (
          value === ""
        ) {

          delete current[key];

        } else {

          /*
           * ? は安全のため
           * カレンダーへ反映しない。
           */

          delete current[key];
        }
      });

      saveShifts(
        current
      );

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
