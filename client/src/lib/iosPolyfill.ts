/**
 * iOS Safari 兼容性 polyfill
 * 为不支持 Promise.withResolvers 的旧版 Safari 提供 polyfill
 */

export function setupIOSPolyfills() {
  // 检查是否需要 Promise.withResolvers polyfill
  if (typeof Promise.withResolvers === 'undefined') {
    console.log('[iOS Polyfill] Adding Promise.withResolvers polyfill');
    
    // 添加 Promise.withResolvers polyfill
    (Promise as any).withResolvers = function <T>() {
      let resolve: (value: T | PromiseLike<T>) => void;
      let reject: (reason?: any) => void;
      
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      
      return { promise, resolve: resolve!, reject: reject! };
    };
    
    console.log('[iOS Polyfill] Promise.withResolvers polyfill installed');
  }
}
