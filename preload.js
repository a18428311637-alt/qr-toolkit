const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('qrAPI', {
  /**
   * 生成二维码，返回 PNG Data URL
   * @param {string} text
   * @param {object} options
   * @returns {Promise<{success:boolean, dataUrl?:string, reason?:string}>}
   */
  generateQR: (text, options) => ipcRenderer.invoke('generate-qr', text, options),

  /**
   * 保存二维码图片到本地
   * @param {string} dataUrl
   * @returns {Promise<{success:boolean, filePath?:string, reason?:string}>}
   */
  saveQRImage: (dataUrl) => ipcRenderer.invoke('save-qr-image', dataUrl),

  /**
   * 选择本地图片并识别二维码
   * @returns {Promise<{success:boolean, dataUrl?:string, qrText?:string|null, reason?:string}>}
   */
  openAndRecognizeQR: () => ipcRenderer.invoke('open-and-recognize-qr'),

  /**
   * 从 Base64 Data URL 识别二维码（用于拖拽场景）
   * @param {string} dataUrl
   * @returns {Promise<{success:boolean, qrText?:string|null, reason?:string}>}
   */
  recognizeQRFromData: (dataUrl) => ipcRenderer.invoke('recognize-qr-from-data', dataUrl),

  /**
   * 将文本复制到系统剪贴板
   * @param {string} text
   * @returns {Promise<{success:boolean}>}
   */
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
});
