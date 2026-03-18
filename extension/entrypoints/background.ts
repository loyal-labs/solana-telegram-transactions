import {
  activeWalletSource,
  connectedExternalWallet,
} from "~/src/lib/storage";

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "WALLET_CONNECTED" && message.publicKey) {
      connectedExternalWallet.setValue(message.publicKey);
      activeWalletSource.setValue("external");
    }
  });
});
