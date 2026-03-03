# Connect

> Connect to Phantom wallets with the React SDK.

The React SDK follows a clear connection pattern using hooks for wallet connection and chain-specific operations.

<Info>
  **Learn about Phantom Connect**: For details about authentication flows, login, account selection, and session management, see the [Phantom Connect](/phantom-connect) guide.
</Info>

## Connection flow

1. **Provider Setup**: Wrap your app with `PhantomProvider` and specify enabled providers
2. **Connection**: Use `useConnect()` or `useModal()` to establish wallet connection
3. **Chain Operations**: Use chain-specific hooks (`useSolana()`, `useEthereum()`) for transactions and signing

```tsx  theme={null}
import { useConnect, useSolana, useEthereum } from "@phantom/react-sdk";

function WalletExample() {
  const { connect } = useConnect();
  const { solana } = useSolana();
  const { ethereum } = useEthereum();

  // 1. Connect first - specify which provider to use
  const handleConnect = async () => {
    await connect({ provider: "google" }); // or "apple", "injected"
  };

  // 2. Then use chain-specific operations
  const sendSolanaTransaction = async () => {
    const result = await solana.signAndSendTransaction(transaction);
  };

  const sendEthereumTransaction = async () => {
    const result = await ethereum.sendTransaction(transaction);
  };
}
```

## Core connection hooks

### useConnect hook

Connect to wallet with an authentication provider:

```tsx  theme={null}
import { useConnect } from "@phantom/react-sdk";

function ConnectButton() {
  const { connect, isConnecting, error } = useConnect();

  const handleConnect = async () => {
    try {
      const { walletId, addresses } = await connect({ provider: "google" });
      console.log("Connected addresses:", addresses);
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  return (
    <button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
```

## Authentication providers

The `connect()` method accepts a `provider` parameter to specify how users should authenticate:

```tsx  theme={null}
// Connect with Google OAuth
await connect({ provider: "google" });

// Connect with Apple OAuth
await connect({ provider: "apple" });

// Connect directly to the injected Phantom extension
await connect({ provider: "injected" });
```

<Info>
  The `"deeplink"` provider opens the Phantom mobile app on mobile devices. It only appears in the connection modal when the Phantom extension is not installed. Include it in your `providers` array for mobile support.
</Info>

### useIsExtensionInstalled hook

The `"injected"` provider directly connects to the user's Phantom browser extension (not an embedded wallet). Use the `useIsExtensionInstalled` hook to check if the extension is installed:

```tsx  theme={null}
import { useConnect, useIsExtensionInstalled } from "@phantom/react-sdk";

function InjectedConnectButton() {
  const { connect, isConnecting } = useConnect();
  const { isInstalled, isLoading } = useIsExtensionInstalled();

  const handleInjectedConnect = async () => {
    if (isInstalled) {
      await connect({ provider: "injected" });
    }
  };

  if (isLoading) {
    return <div>Checking for Phantom extension...</div>;
  }

  if (!isInstalled) {
    return (
      <div>
        <p>Phantom extension not found.</p>
        <a href="https://phantom.app/download" target="_blank">
          Install Phantom
        </a>
      </div>
    );
  }

  return (
    <button onClick={handleInjectedConnect} disabled={isConnecting}>
      Connect to Phantom Extension
    </button>
  );
}
```

When to use injected provider:

* User wants to use their existing extension wallet directly
* No embedded wallet creation needed
* Direct access to extension accounts and balances

## Core account hooks

### useAccounts hook

Get connected wallet addresses:

```tsx  theme={null}
import { useAccounts } from "@phantom/react-sdk";

function WalletAddresses() {
  const addresses = useAccounts();

  if (!addresses) {
    return <div>Not connected</div>;
  }

  return (
    <div>
      {addresses.map((addr, index) => (
        <div key={index}>
          <strong>{addr.addressType}:</strong> {addr.address}
        </div>
      ))}
    </div>
  );
}
```

### useDisconnect hook

Disconnect from a wallet:

```tsx  theme={null}
import { useDisconnect } from "@phantom/react-sdk";

function DisconnectButton() {
  const { disconnect, isDisconnecting } = useDisconnect();

  return (
    <button onClick={disconnect} disabled={isDisconnecting}>
      {isDisconnecting ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}
```

## Using the Connection Modal

The SDK includes a built-in connection modal that provides a user-friendly interface for connecting to Phantom. Use the `useModal()` hook to control it:

```tsx  theme={null}
import { PhantomProvider, useModal, darkTheme, usePhantom, AddressType } from "@phantom/react-sdk";

function App() {
  return (
    <PhantomProvider
      config={{
        providers: ["google", "apple", "injected", "deeplink"],
        appId: "your-app-id",
        addressTypes: [AddressType.solana, AddressType.ethereum],
        authOptions: {
          redirectUrl: "https://yourapp.com/auth/callback", // Required for OAuth providers (google, apple)
        },
      }}
      theme={darkTheme} // Optional: darkTheme or lightTheme
      appIcon="https://your-app.com/icon.png"
      appName="Your App Name"
    >
      <YourApp />
    </PhantomProvider>
  );
}

function ConnectButton() {
  const { open } = useModal();
  const { isConnected } = usePhantom();

  if (isConnected) {
    return <div>Connected!</div>;
  }

  return <button onClick={open}>Connect Wallet</button>;
}
```

**Modal Features:**

* Multiple auth providers (Google, Apple, browser extension)
* Automatic provider detection
* Mobile support with deeplink options
* Built-in error handling and loading states

## Using ConnectBox for auth callbacks

The `ConnectBox` component provides an inline, embedded connection experience that's perfect for auth callback pages. Unlike the modal, it renders directly in your page flow and automatically handles all OAuth callback states.

<Frame>
  <img src="https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=3237ac1f40c9034f8488362ebe3bc7c5" alt="ConnectBox component showing login options" data-og-width="686" width="686" data-og-height="1032" height="1032" data-path="resources/images/phantom-connect/connect-box-component.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=280&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=895001d3a741ff63a774ba9f4bc3a81d 280w, https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=560&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=b75ebf20295b042f2a3d7fcab15dbc6e 560w, https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=840&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=90ddbeed27079d55cbddbd92308db4a2 840w, https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=1100&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=92d320771f3307098cc32403cf1a8567 1100w, https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=1650&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=201368074b8bc9afb3d046a2c70038e2 1650w, https://mintcdn.com/phantom-e50e2e68/6Jx1knw-O3z4Ex2i/resources/images/phantom-connect/connect-box-component.png?w=2500&fit=max&auto=format&n=6Jx1knw-O3z4Ex2i&q=85&s=01db56344fd01ad8e7d01c00296fd251 2500w" />
</Frame>

### Setting up auth callback page

When using OAuth providers (Google, Apple), users are redirected to your callback URL after authentication. Use `ConnectBox` on this page to handle the callback flow:

```tsx  theme={null}
// pages/auth/callback.tsx or app/auth/callback/page.tsx
import { PhantomProvider, ConnectBox, darkTheme } from "@phantom/react-sdk";
import { AddressType } from "@phantom/browser-sdk";

function AuthCallbackPage() {
  return (
    <PhantomProvider
      config={{
        providers: ["google", "apple", "injected"],
        appId: "your-app-id",
        addressTypes: [AddressType.solana, AddressType.ethereum],
        authOptions: {
          redirectUrl: "https://yourapp.com/auth/callback",
        },
      }}
      theme={darkTheme}
      appIcon="https://your-app.com/icon.png"
      appName="Your App Name"
    >
      <div className="flex items-center justify-center min-h-screen">
        <ConnectBox />
      </div>
    </PhantomProvider>
  );
}
```

### ConnectBox props

| Property      | Type               | Default   | Description                            |
| ------------- | ------------------ | --------- | -------------------------------------- |
| `maxWidth`    | `string \| number` | `"350px"` | Maximum width of the box               |
| `transparent` | `boolean`          | `false`   | Removes background, border, and shadow |
| `appIcon`     | `string`           | —         | URL to your app icon                   |
| `appName`     | `string`           | —         | Your app name                          |

### Usage examples

```tsx  theme={null}
import { ConnectBox } from "@phantom/react-sdk";

// Default embedded box
<ConnectBox />

// Custom width
<ConnectBox maxWidth="500px" />

// Transparent (blends with your page background)
<ConnectBox transparent />

// Override app icon and name for this instance
<ConnectBox 
  appIcon="https://your-app.com/custom-icon.png"
  appName="Custom App Name"
/>
```

### ConnectBox vs modal

| Feature                | ConnectBox                         | Modal                |
| ---------------------- | ---------------------------------- | -------------------- |
| Rendering              | Inline in page flow                | Floating overlay     |
| Close button           | No                                 | Yes                  |
| Auth callback handling | Automatic                          | Manual               |
| Use case               | Auth callback pages, embedded auth | On-demand connection |
| Background             | Customizable / transparent         | Overlay backdrop     |

<Tip>
  **Best practice**: Use `ConnectBox` on your OAuth callback page (`/auth/callback`) to automatically handle the authentication completion flow. The component shows loading states during token exchange and displays any errors clearly.
</Tip>

## Configuration Options

**Important notes about `redirectUrl`:**

* Must be an existing page/route in your application
* Must be whitelisted in your Phantom Portal app configuration
* This is where users will be redirected after completing OAuth authentication
* Required for google and apple providers
* Not required for injected provider

## Handling connection errors

When a connection fails, the `connect()` promise rejects with an error.

```tsx  theme={null}
import { useConnect } from "@phantom/react-sdk";

function ConnectButton() {
  const { connect, isConnecting, error } = useConnect();

  const handleConnect = async () => {
    try {
      const { walletId, addresses } = await connect({ provider: "google" });
      // Connection successful
      console.log("Connected addresses:", addresses);
    } catch (err) {
      // Connection failed (user cancelled, network error, etc)
      console.error("Failed to connect:", err);
    }
  };

  return (
    <button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt