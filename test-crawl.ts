import { crawlScholarshipMarket } from './src/server/geminiBackend.ts';

async function run() {
  process.env.GEMINI_API_KEY = "dummy"; // Try to force it to use actual API if possible, or see mock behavior
  try {
    const res = await crawlScholarshipMarket(["2025/2026"]);
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
