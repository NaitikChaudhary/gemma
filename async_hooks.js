// Empty polyfill for async_hooks - Cloudflare Edge Runtime compatibility
export default {};
export const createHook = () => ({});
export const executionAsyncResource = () => ({});
export const executionAsyncId = () => 0;
export const triggerAsyncId = () => 0;
