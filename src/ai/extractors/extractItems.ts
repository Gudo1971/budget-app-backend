import { runExtraction } from "../engine/engine";
import { itemExtractionPrompt } from "../prompts/itemExtractionPrompt";
import { ItemListSchema, ItemList } from "../schemas/ItemListSchema";

export async function extractItems(ocrText: string): Promise<ItemList> {
  const items = await runExtraction(
    itemExtractionPrompt(ocrText),
    ItemListSchema,
  );

  // Geen budget-mapping, alleen AI-items teruggeven
  return items;
}
