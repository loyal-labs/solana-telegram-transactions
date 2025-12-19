import { Eip712Signer } from "@nillion/nuc";
import { Wallet } from "ethers";
import { ethers } from "ethers";

export const getEip712Wallet = (): ethers.Wallet => {
  const privateKey = process.env.NILLION_PRIVATE_KEY_HEX;
  if (!privateKey) {
    throw new Error("NILLION_PRIVATE_KEY_HEX is not set");
  }
  return new ethers.Wallet(privateKey);
};

export const getEip712Signer = (wallet: Wallet): Eip712Signer => {
  const eip712CompatibleSigner: Eip712Signer = {
    getAddress: async () => wallet.getAddress(),
    signTypedData: async ({ domain, types, message }) => {
      // Ethers expects the `types` object without the `EIP712Domain` entry.
      const typesWithoutDomain: Record<
        string,
        Array<ethers.TypedDataField>
      > = {};
      for (const [key, value] of Object.entries(types ?? {}) as Array<
        [string, unknown]
      >) {
        if (key === "EIP712Domain") {
          continue;
        }
        if (Array.isArray(value)) {
          typesWithoutDomain[key] = [
            ...(value as Array<ethers.TypedDataField>),
          ];
        }
      }
      const signature = await wallet.signTypedData(
        domain as ethers.TypedDataDomain,
        typesWithoutDomain,
        message as Record<string, unknown>
      );
      return signature as `0x${string}`;
    },
  };
  return eip712CompatibleSigner;
};
