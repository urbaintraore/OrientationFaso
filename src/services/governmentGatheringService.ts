import { analyzeGovernmentContent } from "./gemini";
import { governmentOpportunityService } from "./governmentOpportunityService";
import { GovernmentOpportunity } from "../types";

export const governmentGatheringService = {
  /**
   * Fetches content from a government URL via our proxy
   */
  async fetchSourceContent(url: string) {
    try {
      const response = await fetch('/api/government/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching source ${url}:`, error);
      throw error;
    }
  },

  /**
   * Main entry point to gather all opportunities
   */
  async gatherAll() {
    const sources = [
      { url: 'https://www.ciospb.gov.bf/actualites', source: 'CIOSPB' },
      { url: 'https://foser.bf/actualites', source: 'FOSER' }
    ];

    const results = {
      added: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const { url, source } of sources) {
      try {
        console.log(`Gathering started for ${source}...`);
        const { content, links } = await this.fetchSourceContent(url);
        
        // 1. Analyze initial content
        const opportunities = await analyzeGovernmentContent(content, url, source);
        
        if (opportunities.length > 0) {
          const syncResult = await governmentOpportunityService.syncWithSource(source as any, opportunities as any);
          results.added += syncResult.added;
          results.updated += syncResult.updated;
        }

        // 2. Look for PDF links or deep links if needed (can be expanded)
        // For simplicity, we stick to the main page analysis for now.
        
      } catch (error: any) {
        console.error(`Error gathering from ${source}:`, error);
        results.errors.push(`${source}: ${error.message}`);
      }
    }

    return results;
  }
};
