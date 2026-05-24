export async function run() {
  console.log("GEMINI_API_KEY is:", process.env.GEMINI_API_KEY ? "defined" : "undefined");
}
run();
