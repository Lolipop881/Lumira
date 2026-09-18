declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GEMINI_API_KEY?: string;
    AI_DAILY_REQUEST_LIMIT?: string;
    PLANTNET_API_KEY?: string;
    OPENAI_API_KEY?: string;
    OPENAI_VISION_MODEL?: string;
  }
}
