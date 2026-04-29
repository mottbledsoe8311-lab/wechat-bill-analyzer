/**
 * 访客ID管理工具
 * 使用浏览器指纹生成唯一的访客ID
 * 支持跨浏览器、隐私模式、清除数据后的识别
 */

import { generateBrowserFingerprint } from './browserFingerprint';

const VISITOR_ID_KEY = 'wechat_bill_analyzer_visitor_id';

/**
 * 获取或创建访客ID
 * 策略：
 * 1. 优先使用localStorage中存储的ID（最稳定）
 * 2. 如果localStorage不可用或没有存储ID，使用浏览器指纹（支持隐私模式和清除数据后识别）
 * 
 * 关键：visitorId必须稳定，同一设备同一浏览器每次调用都返回相同的ID
 */
export function getOrCreateVisitorId(): string {
  try {
    // 尝试从localStorage获取已存储的ID
    const storedId = localStorage.getItem(VISITOR_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // localStorage中没有ID，使用浏览器指纹作为ID
    // 浏览器指纹本身就是稳定的，同一设备同一浏览器生成的指纹总是相同的
    const fingerprint = generateBrowserFingerprint();

    // 尝试存储ID到localStorage
    try {
      localStorage.setItem(VISITOR_ID_KEY, fingerprint);
    } catch (e) {
      // localStorage可能不可用（隐私模式），继续使用指纹ID
    }

    return fingerprint;
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
  } catch (error) {
    console.warn('Failed to clear visitor ID:', error);
  }
}
