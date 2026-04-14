const { app, BrowserWindow, ipcMain, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const jsQR = require('jsqr');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 720,
    minHeight: 520,
    title: 'QR Toolkit',
    backgroundColor: '#F9FAFB',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC: 生成二维码，返回 PNG Data URL ──
ipcMain.handle('generate-qr', async (_event, text, options) => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.width || 260,
      margin: options.margin ?? 2,
      color: options.color || { dark: '#111827', light: '#FFFFFF' },
    });
    return { success: true, dataUrl };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// ── IPC: 保存二维码图片 ──
ipcMain.handle('save-qr-image', async (_event, dataUrl) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '保存二维码图片',
    defaultPath: 'qrcode.png',
    filters: [{ name: 'PNG 图片', extensions: ['png'] }],
  });
  if (canceled || !filePath) return { success: false, reason: 'cancelled' };

  try {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return { success: true, filePath };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// ── IPC: 选择图片并识别二维码 ──
ipcMain.handle('open-and-recognize-qr', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '选择包含二维码的图片',
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'gif'] },
    ],
  });
  if (canceled || filePaths.length === 0) return { success: false, reason: 'cancelled' };

  try {
    const buffer = fs.readFileSync(filePaths[0]);
    const ext = path.extname(filePaths[0]).slice(1).toLowerCase();
    const mime =
      ext === 'jpg' || ext === 'jpeg' ? 'jpeg'
      : ext === 'bmp' ? 'bmp'
      : ext === 'webp' ? 'webp'
      : ext === 'gif' ? 'gif'
      : 'png';
    const dataUrl = `data:image/${mime};base64,${buffer.toString('base64')}`;

    // 在主进程中识别二维码
    const { nativeImage } = require('electron');
    const img = nativeImage.createFromBuffer(buffer);
    const size = img.getSize();
    const bitmap = img.toBitmap();
    const rgba = new Uint8ClampedArray(bitmap.length);
    // nativeImage.toBitmap() 返回 BGRA，需转为 RGBA
    for (let i = 0; i < bitmap.length; i += 4) {
      rgba[i] = bitmap[i + 2];     // R
      rgba[i + 1] = bitmap[i + 1]; // G
      rgba[i + 2] = bitmap[i];     // B
      rgba[i + 3] = bitmap[i + 3]; // A
    }
    const code = jsQR(rgba, size.width, size.height, { inversionAttempts: 'dontInvert' });

    return {
      success: true,
      dataUrl,
      qrText: code ? code.data : null,
    };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// ── IPC: 识别拖拽图片的 Base64 数据中的二维码 ──
ipcMain.handle('recognize-qr-from-data', async (_event, dataUrl) => {
  try {
    const base64 = dataUrl.replace(/^data:image\/[^;]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const { nativeImage } = require('electron');
    const img = nativeImage.createFromBuffer(buffer);
    const size = img.getSize();
    const bitmap = img.toBitmap();
    const rgba = new Uint8ClampedArray(bitmap.length);
    for (let i = 0; i < bitmap.length; i += 4) {
      rgba[i] = bitmap[i + 2];
      rgba[i + 1] = bitmap[i + 1];
      rgba[i + 2] = bitmap[i];
      rgba[i + 3] = bitmap[i + 3];
    }
    const code = jsQR(rgba, size.width, size.height, { inversionAttempts: 'dontInvert' });
    return { success: true, qrText: code ? code.data : null };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

// ── IPC: 复制到剪贴板 ──
ipcMain.handle('copy-to-clipboard', async (_event, text) => {
  clipboard.writeText(text);
  return { success: true };
});
