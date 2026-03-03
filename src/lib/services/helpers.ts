import type { IrysTableOfContents } from "./types";

export function createEmptyTableOfContents(): IrysTableOfContents {
  return {
    irysKey: undefined,
    entries: [],
  };
}
