declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    APP_SECRET?: string;
    INITIAL_STOCK_JSON?: string;
    SETUP_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
