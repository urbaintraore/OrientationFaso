import { crawlScholarshipMarket } from './src/server/geminiBackend.ts';

async function run() {
  try {
    const res = await crawlScholarshipMarket(["2025/2026"]);
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
