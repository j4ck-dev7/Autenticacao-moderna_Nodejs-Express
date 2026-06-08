import axios from 'axios';

// Axios instance for backend API. We use `withCredentials: true`
// so the browser will send/receive the session cookie (connect.sid).
// See: https://axios-http.com/docs/req_config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor to normalize lockout and rate-limit errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = error;
    const res = err.response;
    if (res) {
      const contentType = res.headers && (res.headers['content-type'] || '');

      // Detect HTML lockout page returned by backend (after too many attempts)
      if (contentType.includes('text/html') || contentType.includes('text/xhtml')) {
        err.isLockout = true;
        // attach HTML body so UI can inspect or show message
        err.lockoutHtml = res.data;
        // try to extract an email value from a hidden input if present
        try {
          const match = /name=["']email["']\s+value=["']([^"']+)["']/i.exec(res.data);
          if (match) err.lockoutEmail = match[1];
        } catch (e) {
          // ignore parse errors
        }
      }

      // Detect rate limit (429)
      if (res.status === 429) {
        err.isRateLimit = true;
        const resetHeader = res.headers['ratelimit-reset'] || res.headers['ratelimit_reset'] || res.headers['retry-after'];
        const remainingHeader = res.headers['ratelimit-remaining'] || res.headers['ratelimit_remaining'];
        const limitHeader = res.headers['ratelimit-limit'] || res.headers['ratelimit_limit'];
        err.rateLimitRemaining = remainingHeader ? parseInt(remainingHeader, 10) : undefined;
        err.rateLimitLimit = limitHeader ? parseInt(limitHeader, 10) : undefined;
        err.rateLimitResetSeconds = resetHeader ? parseInt(resetHeader, 10) : 60;
      }

      // Attach attemptsRemaining if provided in JSON body
      if (res.data && typeof res.data.attemptsRemaining !== 'undefined') {
        err.attemptsRemaining = res.data.attemptsRemaining;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
