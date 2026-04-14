/* renderer.js — 前端交互逻辑 */

// ── Tab 切换 ──
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// ── Toast 提示 ──
function showToast(message, type = 'info', duration = 2200) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ══════════════════════════════════
//   生成二维码
// ══════════════════════════════════
const qrInput = document.getElementById('qr-input');
const btnGenerate = document.getElementById('btn-generate');
const qrImage = document.getElementById('qr-image');
const genPlaceholder = document.getElementById('gen-placeholder');
const btnSave = document.getElementById('btn-save');

// 保存当前生成的 Data URL，用于后续保存
let currentQRDataUrl = null;

btnGenerate.addEventListener('click', async () => {
  const text = qrInput.value.trim();
  if (!text) {
    showToast('请输入文字或 URL', 'error');
    return;
  }

  try {
    const result = await window.qrAPI.generateQR(text, {
      width: 260,
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' },
    });

    if (!result.success) {
      showToast('生成失败：' + result.reason, 'error');
      return;
    }

    currentQRDataUrl = result.dataUrl;
    qrImage.src = result.dataUrl;
    qrImage.hidden = false;
    genPlaceholder.hidden = true;
    btnSave.hidden = false;
    showToast('二维码已生成', 'success');
  } catch (err) {
    showToast('生成失败：' + err.message, 'error');
  }
});

btnSave.addEventListener('click', async () => {
  if (!currentQRDataUrl) return;
  const result = await window.qrAPI.saveQRImage(currentQRDataUrl);
  if (result.success) {
    showToast('已保存到 ' + result.filePath, 'success');
  } else if (result.reason !== 'cancelled') {
    showToast('保存失败：' + result.reason, 'error');
  }
});

// ══════════════════════════════════
//   识别二维码
// ══════════════════════════════════
const dropZone = document.getElementById('drop-zone');
const imgPreviewWrap = document.getElementById('img-preview-wrap');
const imgPreview = document.getElementById('img-preview');
const btnRemoveImg = document.getElementById('btn-remove-img');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultContent = document.getElementById('result-content');
const resultText = document.getElementById('result-text');
const btnCopy = document.getElementById('btn-copy');

// 点击拖拽区域 → 打开文件选择并识别
dropZone.addEventListener('click', async () => {
  try {
    const result = await window.qrAPI.openAndRecognizeQR();
    if (!result.success) {
      if (result.reason !== 'cancelled') {
        showToast('打开图片失败：' + result.reason, 'error');
      }
      return;
    }
    showRecognitionResult(result.dataUrl, result.qrText);
  } catch (err) {
    showToast('操作失败：' + err.message, 'error');
  }
});

// 拖拽支持
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) {
    showToast('请拖入图片文件', 'error');
    return;
  }

  // 读取为 data URL
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const dataUrl = ev.target.result;
    try {
      const result = await window.qrAPI.recognizeQRFromData(dataUrl);
      if (result.success) {
        showRecognitionResult(dataUrl, result.qrText);
      } else {
        // 即使识别失败也显示图片预览
        showRecognitionResult(dataUrl, null);
        showToast('识别失败：' + result.reason, 'error');
      }
    } catch (err) {
      showRecognitionResult(dataUrl, null);
      showToast('识别失败：' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
});

// 移除图片
btnRemoveImg.addEventListener('click', () => {
  imgPreviewWrap.hidden = true;
  dropZone.hidden = false;
  imgPreview.src = '';
  resultPlaceholder.hidden = false;
  resultContent.hidden = true;
  btnCopy.hidden = true;
  resultText.textContent = '';
});

// 显示识别结果
function showRecognitionResult(dataUrl, qrText) {
  imgPreview.src = dataUrl;
  imgPreviewWrap.hidden = false;
  dropZone.hidden = true;

  if (qrText) {
    resultText.textContent = qrText;
    resultPlaceholder.hidden = true;
    resultContent.hidden = false;
    btnCopy.hidden = false;
    showToast('识别成功', 'success');
  } else {
    resultText.textContent = '';
    resultPlaceholder.hidden = false;
    resultContent.hidden = true;
    btnCopy.hidden = true;
    showToast('未检测到二维码', 'error');
  }
}

// 复制结果
btnCopy.addEventListener('click', async () => {
  const text = resultText.textContent;
  if (!text) return;
  const result = await window.qrAPI.copyToClipboard(text);
  if (result.success) {
    showToast('已复制到剪贴板', 'success');
  }
});
