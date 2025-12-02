import { Tag } from "@irys/upload-core";

import { getIrysUploader } from "./uploader";

export const uploadToIrys = async (data: string, tags: Tag[] = []) => {
  const irysUploader = await getIrysUploader();
  const result = await irysUploader.upload(data, { tags });
  return result;
};
