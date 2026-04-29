/**
 * 浏览器指纹生成算法
 * 通过收集浏览器和设备信息生成稳定的唯一标识符
 * 即使清除localStorage或使用隐私模式也能识别
 */

/**
 * 收集浏览器信息
 */
function getBrowserInfo(): string {
  const parts: string[] = [];

  // User-Agent
  parts.push(navigator.userAgent);

  // 屏幕信息
  parts.push(`${window.screen.width}x${window.screen.height}`);
  parts.push(`${window.screen.colorDepth}`);

  // 时区
  parts.push(new Date().getTimezoneOffset().toString());

  // 语言
  parts.push(navigator.language);

  // 硬件并发数
  parts.push(navigator.hardwareConcurrency?.toString() || 'unknown');

  // 设备内存
  parts.push(((navigator as any).deviceMemory || 'unknown').toString());

  // 平台
  parts.push(navigator.platform);

  // WebGL信息
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter((debugInfo as any).UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL);
        parts.push(`${vendor}:${renderer}`);
      }
    }
  } catch (e) {
    // WebGL不可用
  }

  // Canvas指纹
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Browser Fingerprint', 4, 17);
      parts.push(canvas.toDataURL());
    }
  } catch (e) {
    // Canvas不可用
  }

  return parts.join('|');
}

/**
 * 简单的哈希函数
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * 生成浏览器指纹
 */
export function generateBrowserFingerprint(): string {
  const browserInfo = getBrowserInfo();
  const hash = simpleHash(browserInfo);
  return `fp-${hash}`;
}

/**
 * 生成完整的访客ID（浏览器指纹 + 时间戳）
 * 浏览器指纹提供设备识别，时间戳提供唯一性
 */
export function generateVisitorIdWithFingerprint(): string {
  const fingerprint = generateBrowserFingerprint();
  const timestamp = Date.now().toString(36);
  return `${fingerprint}-${timestamp}`;
}
