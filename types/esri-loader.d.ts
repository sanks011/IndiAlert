declare module 'esri-loader' {
  export function loadModules(
    modules: string[],
    options?: {
      css?: boolean;
      url?: string;
      version?: string;
    }
  ): Promise<any[]>;

  export function loadScript(options?: {
    url?: string;
    version?: string;
  }): Promise<void>;

  export function isLoaded(): boolean;
}
