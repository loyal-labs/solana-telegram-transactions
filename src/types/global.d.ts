// Productlane Widget Types
type ProductlaneWidget = {
  init: (config: {
    widgetKey: string;
    user?: { email: string };
    theme?: {
      "--accent-color"?: string;
      "--accent-color-dark"?: string;
    };
    mode?: "light" | "dark" | "auto";
    position?: "left" | "right" | "center";
    disableChangelogNotification?: boolean;
  }) => void;
  open: (view?: "INDEX" | "CHANGELOG" | "DOCS" | "FEEDBACK") => void;
  close: () => void;
  toggle: () => void;
  disable: () => void;
  enable: () => void;
  openDocs: (documentUrlNameOrId: string) => void;
  set: (config: unknown) => void;
  on: (
    event:
      | "loaded"
      | "opened"
      | "closed"
      | "toggled"
      | "customLinkClicked"
      | "openDocsPage",
    callback: (data?: unknown) => void
  ) => void;
  off: (event: "opened" | "closed" | "toggled", callback: () => void) => void;
  queue: Record<string, { args: IArguments }>;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: Global augmentation requires interface
  interface Window {
    Productlane?: ProductlaneWidget;
  }
}

export {};
