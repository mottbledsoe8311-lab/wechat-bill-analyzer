/**
 * 访客ID管理工具
 * 为每个访客生成唯一的ID并存储在localStorage中
 */

const VISITOR_ID_KEY = 'wechat_bill_analyzer_visitor_id';

/**
 * 生成简单的访客ID（基于时间戳和随机数）
 */
function generateVisitorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * 获取或创建访客ID
 * 如果localStorage中已存在访客ID，则返回该ID
 * 否则生成新的访客ID并存储
 */
export function getOrCreateVisitorId(): string {
  try {
    // 尝试从localStorage获取
    const existingId = localStorage.getItem(VISITOR_ID_KEY);
    if (existingId) {
      return existingId;
    }

    // 生成新的访客ID
    const newId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, newId);
    return newId;
  } catch (error) {
    // 如果localStorage不可用（如隐私浏览模式），生成临时ID
    console.warn('localStorage not available, using temporary visitor ID:', error);
    return generateVisitorId();
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
