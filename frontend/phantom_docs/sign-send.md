# Sign and send transactions

> Transaction signing and sending with React SDK

The React SDK provides chain-specific hooks (`useSolana` and `useEthereum`) for signing and sending transactions with optimal blockchain-specific handling.

<Warning>
  **Embedded wallet limitations**: The `signTransaction` and `signAllTransactions` methods **aren't supported** for embedded wallets. For embedded wallets, use only `signAndSendTransaction` that signs and broadcasts the transaction in a single step.
</Warning>

<Info>
  **Transaction security for embedded wallets**: All transactions signed for embedded wallets pass through Phantom's advanced simulation system before execution. This security layer automatically blocks malicious transactions and transactions from origins that have been reported as malicious, providing an additional layer of protection for your users' assets.
</Info>

## Chain-specific transaction hooks

### Solana transactions (useSolana)

```tsx  theme={null}
import { useSolana } from "@phantom/react-sdk";

function SolanaTransactions() {
  const { solana } = useSolana();

  const sendTransaction = async () => {
    // Sign and send transaction
    const result = await solana.signAndSendTransaction(transaction);
    console.log("Transaction sent:", result.hash);
  };

  const signOnly = async () => {
    // Just sign (without sending) - Note: Not supported for embedded wallets
    const signedTx = await solana.signTransaction(transaction);
    console.log("Signed transaction:", signedTx);
  };

  return (
    <div>
      <button onClick={sendTransaction}>Send Transaction</button>
      <button onClick={signOnly}>Sign Only</button>
    </div>
  );
}
```

### Ethereum transactions (useEthereum)

```tsx  theme={null}
import { useEthereum } from "@phantom/react-sdk";

function EthereumTransactions() {
  const { ethereum } = useEthereum();

  const sendTransaction = async () => {
    const result = await ethereum.sendTransaction({
      to: "0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E",
      value: "1000000000000000000", // 1 ETH in wei
      gas: "21000",
    });
    console.log("Transaction sent:", result.hash);
  };

  return (
    <button onClick={sendTransaction}>Send ETH</button>
  );
}
```

## Transaction examples

### Solana with @solana/web3.js

```tsx  theme={null}
import { VersionedTransaction, TransactionMessage, SystemProgram, PublicKey, Connection } from "@solana/web3.js";
import { useSolana } from "@phantom/react-sdk";

function SolanaExample() {
  const { solana } = useSolana();

  const sendTransaction = async () => {
    // Get recent blockhash
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const { blockhash } = await connection.getLatestBlockhash();

    // Create transfer instruction
    const fromAddress = await solana.getPublicKey();
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(fromAddress),
      toPubkey: new PublicKey(toAddress),
      lamports: 1000000, // 0.001 SOL
    });

    // Create VersionedTransaction
    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(fromAddress),
      recentBlockhash: blockhash,
      instructions: [transferInstruction],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // Sign and send using chain-specific hook
    const result = await solana.signAndSendTransaction(transaction);
    console.log("Transaction sent:", result.hash);
  };

  return <button onClick={sendTransaction}>Send SOL</button>;
}
```

### Solana with @solana/kit

```tsx  theme={null}
import {
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  address,
  compileTransaction,
} from "@solana/kit";
import { useSolana } from "@phantom/react-sdk";

function SolanaKitExample() {
  const { solana } = useSolana();

  const sendTransaction = async () => {
    const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const userPublicKey = await solana.getPublicKey();
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayer(address(userPublicKey), tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    );

    const transaction = compileTransaction(transactionMessage);

    // Sign and send using chain-specific hook
    const result = await solana.signAndSendTransaction(transaction);
    console.log("Transaction sent:", result.hash);
  };

  return <button onClick={sendTransaction}>Send SOL</button>;
}
```

### Ethereum with viem

```tsx  theme={null}
import { parseEther, parseGwei, encodeFunctionData } from "viem";
import { useEthereum } from "@phantom/react-sdk";

function EthereumExample() {
  const { ethereum } = useEthereum();

  const sendEth = async () => {
    const result = await ethereum.sendTransaction({
      to: "0x742d35Cc6634C0532925a3b8D4C8db86fB5C4A7E",
      value: parseEther("1").toString(), // 1 ETH
      gas: "21000",
      gasPrice: parseGwei("20").toString(), // 20 gwei
    });
    console.log("ETH sent:", result.hash);
  };

  const sendToken = async () => {
    const result = await ethereum.sendTransaction({
      to: tokenContractAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientAddress, parseEther("100")],
      }),
      gas: "50000",
      maxFeePerGas: parseGwei("30").toString(),
      maxPriorityFeePerGas: parseGwei("2").toString(),
    });
    console.log("Token sent:", result.hash);
  };

  return (
    <div>
      <button onClick={sendEth}>Send ETH</button>
      <button onClick={sendToken}>Send Token</button>
    </div>
  );
}
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.phantom.com/llms.txt