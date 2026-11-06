/* Central configuration & shared constants.
   Everything environment- or schema-related lives here so it can be
   changed in one place. */

export const STORE_KEY = 'ascend_state_v1';

export const COLORS = ['#e8b84b','#4bc9b0','#e0645a','#7aa6e8','#c98be8','#e89b4b','#8be8a8'];

export const WEEKDAY_LABELS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const WEEKDAY_LABELS_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];

/* Backend (Google Apps Script web app) */
export const LS_API = 'ascend_api_url';
export const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzg2pRESBBaeDPXFpTQk05zYC27_7fYIR4hFBy5uZZzBqQZEID8IQxdvfVxCh5XVLY/exec';
export const LS_SESSION = 'ascend_session';

/* Multi-device polling interval */
export const POLL_INTERVAL_MS = 10000;
