export type BreadcrumbItem = {
    label: string;
    path?: string;
  };
  
  export type RouteMeta = {
    title: string;
    subtitle?: string;
    breadcrumb: BreadcrumbItem[];
  };
  