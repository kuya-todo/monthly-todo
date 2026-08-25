(function () {
  "use strict";

  const VERSION = "9.2";

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


  /*
   * メインボタン
   *
   * 📤 シフト送信
   * 📋 結果を貼る
   *
   * この2つを横並びで表示する。
   */
  function makeButton() {
    const app =
      document.querySelector(".app");

    const calendar =
      document.querySelector(".calendar");

    let wrap =
      document.getElementById(
        "shiftActionButtons"
      );

    if (!wrap) {
      wrap =
        document.createElement("div");

      wrap.id =
        "shiftActionButtons";

      wrap.style.cssText = [
        "display:flex",
        "gap:8px",
        "width:100%",
        "margin:10px 0",
        "box-sizing:border-box"
      ].join(";");

      /*
       * シフト送信ボタン
       */
      const sendBtn =
        document.createElement("button");

      sendBtn.id =
        "shiftImportButton";

      sendBtn.type =
        "button";

      sendBtn.textContent =
        "📤 シフト送信";

      sendBtn.style.cssText = [
        "flex:1",
        "min-width:0",
        "min-height:46px",
        "padding:10px 6px",
        "border:1px solid #d0c8be",
        "border-radius:10px",
        "background:#fffefa",
        "color:#403b36",
        "font-size:15px",
        "font-weight:700",
        "box-sizing:border-box"
      ].join(";");


      /*
       * 結果を貼るボタン
       */
      const pasteBtn =
        document.createElement("button");

      pasteBtn.id =
        "shiftPasteButton";

      pasteBtn.type =
        "button";

      pasteBtn.textContent =
        "📋 結果を貼る";

      pasteBtn.style.cssText = [
        "flex:1",
        "min-width:0",
        "min-height:46px",
        "padding:10px 6px",
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


      /*
       * カレンダーの上に表示
       */
      if (app && calendar) {
        app.insertBefore(
          wrap,
          calendar
        );
      } else if (app) {
        app.insertBefore(
          wrap,
          app.firstChild
        );
      } else {
        document.body.appendChild(
          wrap
        );
      }


      /*
       * シフト送信
       *
       * 直接ショートカットを起動。
       */
      sendBtn.onclick = () => {
        const url =
          "shortcuts://run-shortcut?name=" +
          encodeURIComponent(
            "シフト表をChatGPTへ送る"
          );

        window.location.href = url;
      };


      /*
       * ChatGPT結果を貼る
       */
      pasteBtn.onclick = () => {
        openPasteScreen(
          getMonthInfo()
        );
      };
    }
  }


  /*
   * ChatGPTへ渡す指示文
   */
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


  /*
   * ChatGPT結果貼り付け画面
   */
  function openPasteScreen(info) {
    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    const bg =
      document.createElement("div");

    bg.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:10002",
      "background:#0008",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:15px",
      "box-sizing:border-box"
    ].join(";");

    const box =
      document.createElement("div");

    box.style.cssText = [
      "background:#fffefa",
      "width:min(650px,100%)",
      "max-height:94vh",
      "overflow:auto",
      "border-radius:18px",
      "padding:20px",
      "box-sizing:border-box"
    ].join(";");

    box.innerHTML = `
      <h2 style="
        margin:0 0 8px;
      ">
        📋 結果を貼る
      </h2>

      <p style="
        color:#777;
        font-size:13px;
        line-height:1.6;
      ">
        ChatGPTが返した結果を
        そのまま貼り付けてください。
        <br>
        ${info.year}年${info.month}月・${days}日分
      </p>

      <textarea
        id="aiResultText"
        placeholder="
${info.year}-${pad(info.month)}-01=A
${info.year}-${pad(info.month)}-02=H
${info.year}-${pad(info.month)}-03=なし
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
        type="button"
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
        type="button"
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


    /*
     * キャンセル
     */
    box.querySelector(
      "#cancelAI"
    ).onclick = () => {
      bg.remove();
    };


    /*
     * 結果を解析
     */
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

      if (result.error) {
        alert(result.error);
        return;
      }

      bg.remove();

      showResult(
        result.shifts,
        info
      );
    };


    /*
     * iPhoneのクリップボードから
     * 自動取得を試みる。
     *
     * 取得できなくても、
     * 手動ペーストはそのまま可能。
     */
    if (
      navigator.clipboard &&
      navigator.clipboard.readText
    ) {
      navigator.clipboard
        .readText()
        .then(text => {
          const ta =
            box.querySelector(
              "#aiResultText"
            );

          if (
            ta &&
            text &&
            text.includes("=")
          ) {
            ta.value = text;
          }
        })
        .catch(() => {
          /*
           * iOS側で許可されない場合は
           * 手動ペーストを使用。
           */
        });
    }
  }


  /*
   * ChatGPT結果を解析
   */
  function parseAIResult(
    text,
    info
  ) {
    const shifts = {};

    const lines =
      String(text || "")
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);

    const days =
      new Date(
        info.year,
        info.month,
        0
      ).getDate();

    let count = 0;

    for (const line of lines) {
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


  /*
   * シフト表記を統一
   */
  function normalizeValue(value) {
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


  /*
   * 解析結果を確認
   */
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
      document.createElement("div");

    bg.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:10003",
      "background:#0008",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:15px",
      "box-sizing:border-box"
    ].join(";");

    const box =
      document.createElement("div");

    box.style.cssText = [
      "background:#fffefa",
      "width:min(700px,100%)",
      "max-height:94vh",
      "overflow:auto",
      "border-radius:18px",
      "padding:20px",
      "box-sizing:border-box"
    ].join(";");

    const detected =
      Object.values(shifts)
        .filter(
          x => x !== ""
        ).length;

    const unknown =
      Object.values(shifts)
        .filter(
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
        <strong>${detected}日</strong>

        ${
          unknown
            ? `
              <br>
              ⚠️ 要確認：
              <strong>${unknown}日</strong>
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
        const code of SHIFT_CODES
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
          type="button"
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
          type="button"
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


    box.innerHTML = html;

    bg.appendChild(box);

    document.body.appendChild(bg);


    /*
     * 選択変更時の表示
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


    /*
     * キャンセル
     */
    box.querySelector(
      "#cancelAIResult"
    ).onclick = () => {
      bg.remove();
    };


    /*
     * カレンダーへ反映
     */
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
        } else {
          /*
           * なし・? は
           * 既存シフトを削除。
           */
          delete current[key];
        }
      });

      saveShifts(current);

      bg.remove();

      location.reload();
    };
  }


  /*
   * 初期化
   */
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
