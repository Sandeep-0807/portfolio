import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function AnalyticsListener() {
  const location = useLocation();
  const isFirstPageView = useRef(true);

  useEffect(() => {
    if (isFirstPageView.current) {
      isFirstPageView.current = false;
      return;
    }

    const pagePath = location.pathname + location.search;

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}
