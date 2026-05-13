import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());
  app.use(morgan("dev"));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy to fetch government site content safely
  app.post("/api/government/proxy", async (req, res) => {
    const { url } = req.body;
    if (!url || (!url.includes('ciospb.gov.bf') && !url.includes('foser.bf'))) {
      return res.status(400).json({ error: "Invalid URL. Only governmental sources allowed." });
    }

    try {
      console.log(`Fetching: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Clean up the HTML to reduce token usage
      $('script, style, iframe, nav, footer, header').remove();
      
      const title = $('title').text();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 50000); // Limit to 50k chars
      
      // Extract links to potentially find PDFs or other pages
      const links: { text: string; href: string }[] = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && (href.startsWith('http') || href.startsWith('/'))) {
          // Normalize relative URLs
          const absoluteUrl = href.startsWith('http') ? href : new URL(href, url).toString();
          links.push({ text: text.slice(0, 100), href: absoluteUrl });
        }
      });

      res.json({ 
        title, 
        content: bodyText,
        links: links.filter(l => l.href.includes('.pdf') || l.href.includes('annonce') || l.href.includes('communique') || l.href.includes('actualite') || l.href.includes('opportunite'))
      });
    } catch (error: any) {
      console.error(`Error fetching government site: ${error.message}`);
      res.status(500).json({ error: "Failed to fetch source content.", details: error.message });
    }
  });

  // Mock Scholarship Scraping / Crawling Trigger
  app.post("/api/scholarships/crawl", async (req, res) => {
    // In a real app, this would trigger the actual crawler
    console.log("Crawl requested for sources...");
    res.json({ message: "Crawling started", taskId: Date.now() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
