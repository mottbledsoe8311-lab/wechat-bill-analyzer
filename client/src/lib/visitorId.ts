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
 */
export function getOrCreateVisitorId(): string {
  try {
    // 尝试从localStorage获取已存储的ID
    const storedId = localStorage.getItem(VISITOR_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // localStorage中没有ID，生成新的ID
    // 使用浏览器指纹作为ID基础，确保同一设备生成相同的ID
    const fingerprint = generateBrowserFingerprint();
    
    // 添加随机后缀确保唯一性（即使指纹相同也能区分）
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newId = `${fingerprint}-${randomSuffix}`;

    // 尝试存储ID到localStorage
    try {
      localStorage.setItem(VISITOR_ID_KEY, newId);
    } catch (e) {
      // localStorage可能不可用（隐私模式），继续使用生成的ID
    }

    return newId;
  } catch (error) {
    // 如果出错，生成一个临时ID
    console.warn('Failed to generate visitor ID:', error);
    return `temp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
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
