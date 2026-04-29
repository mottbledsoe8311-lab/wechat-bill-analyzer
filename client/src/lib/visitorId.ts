/**
 * 访客ID管理工具
 * 使用浏览器指纹生成唯一的访客ID
 * 支持跨浏览器、隐私模式、清除数据后的识别
 */

import { generateBrowserFingerprint } from './browserFingerprint';

const VISITOR_ID_KEY = 'wechat_bill_analyzer_visitor_id';
const VISITOR_FINGERPRINT_KEY = 'wechat_bill_analyzer_fingerprint';

/**
 * 获取或创建访客ID
 * 优先使用浏览器指纹（稳定、跨浏览器）
 * fallback到localStorage存储的ID（支持向后兼容）
 */
export function getOrCreateVisitorId(): string {
  try {
    // 生成当前的浏览器指纹
    const currentFingerprint = generateBrowserFingerprint();

    // 尝试从localStorage获取之前存储的指纹
    const storedFingerprint = localStorage.getItem(VISITOR_FINGERPRINT_KEY);
    const storedId = localStorage.getItem(VISITOR_ID_KEY);

    // 如果指纹匹配且有存储的ID，返回存储的ID
    if (storedFingerprint === currentFingerprint && storedId) {
      return storedId;
    }

    // 如果指纹不匹配（可能是不同设备或浏览器），使用新的浏览器指纹作为ID
    // 这样即使清除localStorage也能通过指纹识别
    const newId = currentFingerprint;

    // 存储当前指纹和ID
    try {
      localStorage.setItem(VISITOR_FINGERPRINT_KEY, currentFingerprint);
      localStorage.setItem(VISITOR_ID_KEY, newId);
    } catch (e) {
      // localStorage可能不可用（隐私模式），继续使用指纹作为ID
    }

    return newId;
  } catch (error) {
    // 如果出错，生成一个临时ID
    console.warn('Failed to generate visitor ID:', error);
    return `temp-${Date.now().toString(36)}`;
  }
}

/**
 * 清除访客ID（用于测试或重置）
 */
export function clearVisitorId(): void {
  try {
    localStorage.removeItem(VISITOR_ID_KEY);
    localStorage.removeItem(VISITOR_FINGERPRINT_KEY);
  } catch (error) {
    console.warn('Failed to clear visitor ID:', error);
  }
}
