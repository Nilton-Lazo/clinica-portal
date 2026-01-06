type ClientContext = {
    path: string;
    module: string;
    screen?: string;
  };
  
  let current: ClientContext = {
    path: "/",
    module: "root",
  };
  
  function getModuleFromPath(path: string) {
    const seg = path.split("/").filter(Boolean)[0];
    return seg ?? "root";
  }
  
  export const clientContext = {
    set(input: { path: string; screen?: string }) {
      current = {
        path: input.path,
        module: getModuleFromPath(input.path),
        screen: input.screen,
      };
    },
  
    toHeaders(): Record<string, string> {
      const headers: Record<string, string> = {
        "X-ERP-Path": current.path,
        "X-ERP-Module": current.module,
      };
  
      if (current.screen) {
        headers["X-ERP-Screen"] = current.screen;
      }
  
      return headers;
    },
  };
  