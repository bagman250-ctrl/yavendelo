type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: AnalyticsParams) => void;
  }
}

function cleanAnalyticsParams(params: AnalyticsParams) {
  return Object.entries(params).reduce<AnalyticsParams>((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    if (typeof value === "number" && !Number.isFinite(value)) return acc;

    acc[key] = value;
    return acc;
  }, {});
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return false;

  try {
    window.gtag("event", eventName, {
      app_name: "YaVendelo",
      environment: "production",
      ...cleanAnalyticsParams(params),
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("GA4 event skipped:", eventName, error);
    }

    return false;
  }
}

export const analyticsEvents = {
  viewHome: "view_home",
  search: "search",
  filterCategory: "filter_category",
  viewProduct: "view_product",
  favoriteProduct: "favorite_product",
  publishProduct: "publish_product",
  startChat: "start_chat",
  betaFeedbackSubmit: "feedback_submit",
  boostClick: "boost_click",
  betaPageView: "help_page_view",
  removeFavoriteProduct: "remove_favorite_product",
  boostSuccess: "boost_success",
  loginGoogle: "login_google",
  registerGoogle: "register_google",
} as const;
