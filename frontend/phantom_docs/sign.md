# Sign messages

> Message signing with React SDK

The React SDK provides chain-specific hooks (`useSolana` and `useEthereum`) for signing messages with blockchain-specific handling.

## Chain-specific message signing hooks

### Solana message signing (useSolana)

```tsx  theme={null}
import { useSolana } from "@phantom/react-sdk";

function SolanaMessageSigning() {
  const { solana } = useSolana();

  const handleSign = async () => {
    const signature = await solana.signMessage("Hello Solana!");
    console.log("Signature:", signature.signature);
    console.log("Raw signature:", signature.rawSignature);
  };

  return (
    <button onClick={handleSign}>
      Sign Solana Message
    </button>
  );
}
```

### Ethereum message signing (useEthereum)

```tsx  theme={null}
import { useEthereum } from "@phantom/react-sdk";

function EthereumMessageSigning() {
  const { ethereum } = useEthereum();

  const handleSignPersonal = async () => {
    const accounts = await ethereum.getAccounts();
    const signature = await ethereum.signPersonalMessage("Hello Ethereum!", accounts[0]);
    console.log("Signature:", signature.signature);
  };

  const handleSignTypedData = async () => {
    const accounts = await ethereum.getAccounts();
    const signature = await ethereum.signTypedData(typedData, accounts[0]);
    console.log("Typed data signature:", signature.signature);
  };

  return (
    <div>
      <button onClick={handleSignPersonal}>Sign Personal Message</button>
      <button onClick={handleSignTypedData}>Sign Typed Data</button>
    </div>
  );
}
```

## Complete examples

### Solana message signing

```tsx  theme={null}
import { useSolana } from "@phantom/react-sdk";
import { VersionedTransaction, TransactionMessage, SystemProgram, PublicKey, Connection } from "@solana/web3.js";

function SolanaOperations() {
  const { solana } = useSolana();

  const signMessage = async () => {
    const signature = await solana.signMessage("Hello Solana!");
    console.log("Signature:", signature);
  };



  return (
    <div>
      <button onClick={signMessage}>Sign Message</button>
      <p>Connected: {solana.isConnected ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Ethereum message signing

```tsx  theme={null}
import { useEthereum } from "@phantom/react-sdk";

function EthereumOperations() {
  const { ethereum } = useEthereum();

  const signPersonalMessage = async () => {
    const accounts = await ethereum.getAccounts();
    const signature = await ethereum.signPersonalMessage("Hello Ethereum!", accounts[0]);
    console.log("Signature:", signature);
  };

  const signTypedData = async () => {
    const accounts = await ethereum.getAccounts();
    const typedData = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" }
        ],
        Mail: [
          { name: "from", type: "string" },
          { name: "to", type: "string" },
          { name: "contents", type: "string" }
        ]
      },
      primaryType: "Mail",
      domain: {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
      },
      message: {
        from: "Alice",
        to: "Bob",
        contents: "Hello!"
      }
    };

    const signature = await ethereum.signTypedData(typedData);
    console.log("Typed data signature:", signature);
  };


  return (
    <div>
      <button onClick={signPersonalMessage}>Sign Personal Message</button>
      <button onClick={signTypedData}>Sign Typed Data</button>
      <p>Connected: {ethereum.isConnected ? 'Yes' : 'No'}</p>
    </div>
  );
}
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt