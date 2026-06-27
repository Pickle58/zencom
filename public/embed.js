(function () {
  var script = document.currentScript;
  if (!script) return;

  var embedKey = script.getAttribute("data-key");
  if (!embedKey) {
    console.error("[Zencom] Missing data-key on embed script");
    return;
  }

  var baseUrl = script.src.replace(/\/embed\.js(\?.*)?$/, "");
  var position = script.getAttribute("data-position") || "bottom-right";

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.textContent = "Chat";
  launcher.style.cssText =
    "position:fixed;z-index:2147483000;border:none;border-radius:9999px;padding:12px 16px;" +
    "background:#2563eb;color:#fff;font:600 14px/1 system-ui,sans-serif;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.18)";

  if (position === "bottom-left") {
    launcher.style.left = "20px";
    launcher.style.bottom = "20px";
  } else {
    launcher.style.right = "20px";
    launcher.style.bottom = "20px";
  }

  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;z-index:2147483001;display:none;width:min(400px,calc(100vw - 32px));" +
    "height:min(560px,calc(100vh - 96px));border-radius:16px;overflow:hidden;" +
    "box-shadow:0 16px 40px rgba(0,0,0,.22);background:#fff";

  if (position === "bottom-left") {
    panel.style.left = "20px";
    panel.style.bottom = "76px";
  } else {
    panel.style.right = "20px";
    panel.style.bottom = "76px";
  }

  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/widget/" + encodeURIComponent(embedKey);
  iframe.title = "Zencom chat";
  iframe.style.cssText = "width:100%;height:100%;border:0";
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");

  panel.appendChild(iframe);

  var open = false;
  launcher.addEventListener("click", function () {
    open = !open;
    panel.style.display = open ? "block" : "none";
  });

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
})();
