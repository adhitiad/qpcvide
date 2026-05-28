async function generateSHA256Hash(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

function getCanvasFingerprint() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "no-canvas";
  
  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("auiso,fingerprint!", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("auiso,fingerprint!", 4, 17);
  return canvas.toDataURL();
}

async function getPartialIp() {
  try {
    const res = await fetch("/api/ip");
    if (!res.ok) return "unknown-ip";
    const data = await res.json();
    return data.partialIp || "unknown-ip";
  } catch (e) {
    return "unknown-ip";
  }
}

async function initializeFingerprint() {
  // Check if we already have one
  let fp = localStorage.getItem("auiso_fp");
  if (fp) {
    window.__auiso_fp = fp;
    return fp;
  }

  // Generate new fingerprint
  const canvasFp = getCanvasFingerprint();
  const userAgent = navigator.userAgent;
  const partialIp = await getPartialIp();
  
  // Create raw string
  const rawData = `${canvasFp}|${userAgent}|${partialIp}`;
  
  // Hash it
  fp = await generateSHA256Hash(rawData);
  
  localStorage.setItem("auiso_fp", fp);
  window.__auiso_fp = fp;
  return fp;
}

window.getFingerprint = async function() {
  if (window.__auiso_fp) return window.__auiso_fp;
  return await initializeFingerprint();
};

// Initialize immediately
initializeFingerprint().catch(console.error);
