(function () {
  var script = document.currentScript;
  if (!script) return;

  var embedKey = script.getAttribute("data-key");
  if (!embedKey) {
    console.error("[Zencom] Missing data-key on embed script");
    return;
  }

  var baseUrl = script.src.replace(/\/embed\.js(\?.*)?$/, "");
  var title = script.getAttribute("data-title") || "Chat";
  var color = script.getAttribute("data-color") || "#5B63EB";
  var position = script.getAttribute("data-position") || "bottom-right";
  var borderRadius = script.getAttribute("data-border-radius");
  var proactiveEnabled =
    script.getAttribute("data-proactive-enabled") === "true";
  var proactiveDelay = parseInt(
    script.getAttribute("data-proactive-delay") || "5000",
    10,
  );
  var proactiveMessage =
    script.getAttribute("data-proactive-message") || "Hi! How can we help?";

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.textContent = title;
  launcher.style.cssText =
    "position:fixed;z-index:2147483000;border:none;border-radius:9999px;padding:12px 16px;" +
    "background:" +
    color +
    ";color:#fff;font:600 14px/1 system-ui,sans-serif;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.18)";

  if (position === "bottom-left") {
    launcher.style.left = "20px";
    launcher.style.bottom = "20px";
  } else {
    launcher.style.right = "20px";
    launcher.style.bottom = "20px";
  }

  var panelRadius = borderRadius ? borderRadius + "px" : "16px";
  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;z-index:2147483001;display:none;width:min(400px,calc(100vw - 32px));" +
    "height:min(560px,calc(100vh - 96px));border-radius:" +
    panelRadius +
    ";overflow:hidden;" +
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
  function setOpen(next) {
    open = next;
    panel.style.display = open ? "block" : "none";
  }

  launcher.addEventListener("click", function () {
    setOpen(!open);
  });

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  if (proactiveEnabled && proactiveDelay >= 0) {
    var tooltip = document.createElement("div");
    tooltip.textContent = proactiveMessage;
    tooltip.setAttribute("role", "status");
    tooltip.style.cssText =
      "position:fixed;z-index:2147483002;max-width:240px;padding:10px 14px;" +
      "border-radius:10px;background:#fff;color:#111;font:400 13px/1.4 system-ui,sans-serif;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.16);cursor:pointer;" +
      "border:1px solid rgba(0,0,0,.08)";

    if (position === "bottom-left") {
      tooltip.style.left = "20px";
      tooltip.style.bottom = "72px";
    } else {
      tooltip.style.right = "20px";
      tooltip.style.bottom = "72px";
    }

    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    tooltip.addEventListener("click", function () {
      tooltip.style.display = "none";
      setOpen(true);
    });

    window.setTimeout(function () {
      tooltip.style.display = "block";
    }, proactiveDelay);
  }
})();
