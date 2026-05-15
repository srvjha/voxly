// Kept for backward compatibility. The canonical implementation now
// lives in src/utils/api-error.ts. Old imports of `HttpError` keep
// working — new code should use `ApiError` directly from utils.
export { default as HttpError } from "./utils/api-error.js";
