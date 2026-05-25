import * as React from "react";

export type ReportPreviewBreakpoints = {
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

export function useReportPreviewBreakpoints(): ReportPreviewBreakpoints {
  const [state, setState] = React.useState<ReportPreviewBreakpoints>(() => readBreakpoints());

  React.useEffect(() => {
    const phone = window.matchMedia("(max-width: 639px)");
    const tablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const update = () => setState(readBreakpoints());

    phone.addEventListener("change", update);
    tablet.addEventListener("change", update);
    desktop.addEventListener("change", update);
    window.addEventListener("orientationchange", update);

    return () => {
      phone.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return state;
}

function readBreakpoints(): ReportPreviewBreakpoints {
  if (typeof window === "undefined") {
    return { isPhone: false, isTablet: false, isDesktop: true };
  }
  const isPhone = window.matchMedia("(max-width: 639px)").matches;
  const isTablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)").matches;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  return { isPhone, isTablet, isDesktop };
}
