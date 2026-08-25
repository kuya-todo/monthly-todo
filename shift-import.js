// Monthly Todo - シフト表画像インポート
// 写真からシフトを読み取り、確認後にカレンダーへ反映する機能

(function () {
  "use strict";

  const SHIFT_IMPORT_VERSION = "1.0";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
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
      padding:12px;
      border:1px solid #d0c8be;
      border-radius:10px;
      background:#fffefa;
      color:#403b36;
      font-size:14px;
      font-weight:600;
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

        const result = await Tesseract.recognize(
          file,
          "jpn+eng",
          {
            logger: m => {
              if (m.status === "recognizing text") {
                const p = Math.round((m.progress || 0) * 100);
                btn.textContent = "📖 読み取り中… " + p + "%";
              }
            }
          }
        );

        const text = result.data.text || "";

        showResult(text);

      } catch (e) {
        console.error(e);
        alert(
          "シフト表を読み取れませんでした。\n\n" +
          "写真をもう一度選んで試してください。"
        );
      }

      btn.disabled = false;
      btn.textContent = "📷 シフト表を読み込む";
      input.value = "";
    };

    const app = document.querySelector(".app");
    const calendar = document.querySelector(".calendar");

    if (app && calendar) {
      app.insertBefore(btn, calendar);
      app.insertBefore(input, calendar);
    }
  }

  function showResult(text) {
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
      width:min(500px,100%);
      max-height:90vh;
      overflow:auto;
      border-radius:15px;
      padding:20px;
      box-shadow:0 12px 40px #0004;
    `;

    box.innerHTML = `
      <h2 style="margin-top:0">シフト表を読み取りました</h2>

      <p style="font-size:13px;color:#777">
        読み取った文字を確認してください。
        この段階では、まだカレンダーには反映していません。
      </p>

      <textarea
        style="
          width:100%;
          height:220px;
          box-sizing:border-box;
          border:1px solid #d0c8be;
          border-radius:8px;
          padding:10px;
          font-size:13px;
        "
      ></textarea>

      <div style="
        display:flex;
        gap:8px;
        margin-top:15px;
      ">
        <button id="shiftImportCancel"
          style="
            flex:1;
            min-height:42px;
            border:1px solid #d0c8be;
            background:white;
            border-radius:8px;
          ">
          キャンセル
        </button>

        <button id="shiftImportApply"
          style="
            flex:1;
            min-height:42px;
            border:0;
            background:#626960;
            color:white;
            border-radius:8px;
          ">
          読み取り結果を確認
        </button>
      </div>
    `;

    box.querySelector("textarea").value = text;

    bg.appendChild(box);
    document.body.appendChild(bg);

    box.querySelector("#shiftImportCancel").onclick = () => {
      bg.remove();
    };

    box.querySelector("#shiftImportApply").onclick = () => {
      alert(
        "読み取り結果を確認しました。\n\n" +
        "次の段階で、日付とシフトを対応させてカレンダーへ反映します。"
      );
      bg.remove();
    };
  }

  function init() {
    addImportButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
