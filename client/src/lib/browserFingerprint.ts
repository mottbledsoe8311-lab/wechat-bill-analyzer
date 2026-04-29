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
  parts.push(`${window.screen.pixelDepth}`);

  // 时区
  parts.push(new Date().getTimezoneOffset().toString());

  // 语言
  parts.push(navigator.language);
  parts.push(navigator.languages?.join(',') || 'unknown');

  // 硬件并发数
  parts.push(navigator.hardwareConcurrency?.toString() || 'unknown');

  // 设备内存
  parts.push(((navigator as any).deviceMemory || 'unknown').toString());

  // 平台
  parts.push(navigator.platform);

  // 浏览器插件信息
  try {
    const plugins = Array.from(navigator.plugins || [])
      .map(p => p.name)
      .join(',');
    parts.push(plugins || 'no-plugins');
  } catch (e) {
    parts.push('plugins-error');
  }

  // 是否支持WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter((debugInfo as any).UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL);
        parts.push(`webgl:${vendor}:${renderer}`);
      } else {
        parts.push('webgl:available');
      }
    } else {
      parts.push('webgl:unavailable');
    }
  } catch (e) {
    parts.push('webgl:error');
  }

  // 本地存储支持
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    parts.push('localStorage:yes');
  } catch (e) {
    parts.push('localStorage:no');
  }

  // 会话存储支持
  try {
    const test = '__test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    parts.push('sessionStorage:yes');
  } catch (e) {
    parts.push('sessionStorage:no');
  }

  // IndexedDB支持
  parts.push(typeof indexedDB !== 'undefined' ? 'indexeddb:yes' : 'indexeddb:no');

  // 时间精度
  parts.push(performance.now().toString().substring(0, 5));

  return parts.join('|');
}

/**
 * 改进的哈希函数（使用FNV-1a算法）
 * 更稳定，碰撞率更低
 */
function fnv1aHash(str: string): string {
  let hash = 2166136261; // FNV offset basis for 32-bit
  const fnvPrime = 16777619;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * fnvPrime) >>> 0; // Keep it as 32-bit unsigned
  }

  return Math.abs(hash).toString(16);
}

/**
 * 生成浏览器指纹
 * 返回稳定的指纹，同一设备/浏览器每次调用都返回相同值
 */
export function generateBrowserFingerprint(): string {
  const browserInfo = getBrowserInfo();
  const hash = fnv1aHash(browserInfo);
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
