import { IRYS_MUTABLE_URL } from "./contants";

export const fetchFromIrys = async (txId: string) => {
  if (txId.length !== 44) {
    throw new Error("Invalid txId");
  }
  const url = `${IRYS_MUTABLE_URL}${txId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from Irys: ${response.statusText}`);
  }
  const data = await response.text();
  return data;
};
