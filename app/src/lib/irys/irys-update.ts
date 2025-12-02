import { Tag } from "@irys/upload-core";

import { getIrysUploader } from "./uploader";

export const updateIrysTransaction = async (
  data: string,
  txId: string,
  tags: Tag[] = []
) => {
  if (txId.length !== 43) {
    throw new Error("Invalid txId length");
  }
  tags.push({ name: "Root-TX", value: txId });

  const irysUploader = await getIrysUploader();
  const result = await irysUploader.upload(data, { tags });
  return result;
};
