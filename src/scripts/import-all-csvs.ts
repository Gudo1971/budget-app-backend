import "dotenv/config";

import fs from "fs";
import path from "path";
import { importTransactionsCsv } from "./import-transactions";

async function importAllCsvs() {
  const dataDir = path.join(__dirname, "..", "data");

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));

  console.log(`Found ${files.length} CSV files`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log("Importing:", file);

    if (file.includes("transactions")) {
      await importTransactionsCsv(filePath, "demo-user");
    } else {
      console.log("Skipping non-transaction CSV:", file);
    }
  }

  console.log("All CSVs imported successfully.");
}

importAllCsvs();
