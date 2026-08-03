declare module 'pagedjs' {
  export interface PagedJsFlow {
    performance: number;
    size: unknown;
    pages: unknown[];
  }

  export class Previewer {
    preview(
      content: string | Element,
      stylesheets?: Array<string | Record<string, string>>,
      renderTo?: Element,
    ): Promise<PagedJsFlow>;
  }
}
