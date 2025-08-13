export const DOMAINS = {
  production: "theredpotion.com",
  test: "red1.theredpotion.com",
  local: "localhost:3000",
} as const;

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === "production") {
    return `https://${DOMAINS.production}`;
  }
  
  return `https://${DOMAINS.test}`;
};

export const isLiffEnvironment = () => {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent;
  const isLineApp = userAgent.includes("Line/");
  const url = window.location.href;
  const isLiffUrl = url.includes("liff.line.me") || 
                   url.includes("liff-web.line.me") ||
                   window.location.search.includes("liff");
  
  return isLineApp || isLiffUrl;
};