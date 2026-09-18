declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PLANTNET_API_KEY?: string;
    OPENAI_API_KEY?: string;
    OPENAI_VISION_MODEL?: string;
  }
}
