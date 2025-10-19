import type { SecondaryButtonPosition } from "@telegram-apps/bridge";
import { mainButton, secondaryButton } from "@telegram-apps/sdk-react";
import type { RGB } from "@telegram-apps/types";

import { isInMiniApp } from "./index";

type BaseButtonOptions = {
  text: string;
  isEnabled?: boolean;
  hasShineEffect?: boolean;
  backgroundColor?: RGB;
  textColor?: RGB;
  showLoader?: boolean;
};

export type MainButtonOptions = BaseButtonOptions & {
  onClick?: () => void;
};

export type SecondaryButtonOptions = BaseButtonOptions & {
  onClick?: () => void;
  position?: SecondaryButtonPosition;
};

let detachMainClick: VoidFunction | null = null;
let detachSecondaryClick: VoidFunction | null = null;

const ensureMainButton = () => {
  if (!mainButton.mount.isAvailable()) return false;

  if (!mainButton.isMounted()) {
    mainButton.mount();
  }

  return true;
};

const ensureSecondaryButton = () => {
  if (!secondaryButton.mount.isAvailable()) return false;

  if (!secondaryButton.isMounted()) {
    secondaryButton.mount();
  }

  return true;
};

const buildMainButtonParams = (options: MainButtonOptions) => ({
  text: options.text,
  isVisible: true,
  isEnabled: options.isEnabled ?? true,
  hasShineEffect: options.hasShineEffect ?? false,
  isLoaderVisible: Boolean(options.showLoader),
  ...(options.backgroundColor
    ? { backgroundColor: options.backgroundColor }
    : {}),
  ...(options.textColor ? { textColor: options.textColor } : {}),
});

const buildSecondaryButtonParams = (options: SecondaryButtonOptions) => ({
  text: options.text,
  isVisible: true,
  isEnabled: options.isEnabled ?? true,
  hasShineEffect: options.hasShineEffect ?? false,
  isLoaderVisible: Boolean(options.showLoader),
  ...(options.backgroundColor
    ? { backgroundColor: options.backgroundColor }
    : {}),
  ...(options.textColor ? { textColor: options.textColor } : {}),
  ...(options.position ? { position: options.position } : {}),
});

const bindMainClick = (onClick?: () => void) => {
  if (!mainButton.onClick.isAvailable()) return;

  if (detachMainClick) {
    detachMainClick();
    detachMainClick = null;
  }

  if (onClick) {
    const handler = () => {
      onClick();
    };

    detachMainClick = mainButton.onClick(handler);
  }
};

const bindSecondaryClick = (onClick?: () => void) => {
  if (!secondaryButton.onClick.isAvailable()) return;

  if (detachSecondaryClick) {
    detachSecondaryClick();
    detachSecondaryClick = null;
  }

  if (onClick) {
    const handler = () => {
      onClick();
    };

    detachSecondaryClick = secondaryButton.onClick(handler);
  }
};

export const showMainButton = (options: MainButtonOptions): boolean => {
  if (!isInMiniApp()) return false;
  if (!ensureMainButton()) return false;
  if (!mainButton.setParams.isAvailable()) return false;

  mainButton.setParams(buildMainButtonParams(options));
  bindMainClick(options.onClick);

  return true;
};

export const hideMainButton = (): boolean => {
  if (detachMainClick) {
    detachMainClick();
    detachMainClick = null;
  }

  if (!isInMiniApp()) return false;
  if (!mainButton.setParams.isAvailable()) return false;

  mainButton.setParams({
    isVisible: false,
    isLoaderVisible: false,
  });

  return true;
};

export const showSecondaryButton = (
  options: SecondaryButtonOptions
): boolean => {
  if (!isInMiniApp()) return false;
  if (!ensureSecondaryButton()) return false;
  if (!secondaryButton.setParams.isAvailable()) return false;

  secondaryButton.setParams(buildSecondaryButtonParams(options));
  bindSecondaryClick(options.onClick);

  return true;
};

export const hideSecondaryButton = (): boolean => {
  if (detachSecondaryClick) {
    detachSecondaryClick();
    detachSecondaryClick = null;
  }

  if (!isInMiniApp()) return false;
  if (!secondaryButton.setParams.isAvailable()) return false;

  secondaryButton.setParams({
    isVisible: false,
    isLoaderVisible: false,
  });

  return true;
};
