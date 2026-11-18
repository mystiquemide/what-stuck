import QRCode from "qrcode";

const options = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  color: { dark: "#1c1917", light: "#ffffff" },
};

export function qrSvg(url: string) {
  return QRCode.toString(url, { ...options, type: "svg" });
}

export function qrPng(url: string, width = 1024) {
  return QRCode.toBuffer(url, { ...options, type: "png", width });
}

export function qrDataUrl(url: string, width = 720) {
  return QRCode.toDataURL(url, { ...options, width });
}
