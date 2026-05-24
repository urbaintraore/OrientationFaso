import { analyzeGovernmentContent } from "./gemini";
import { governmentOpportunityService } from "./governmentOpportunityService";
import { careerGatheringService } from "./careerGatheringService";
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
      { url: 'https://foser.bf/actualites', source: 'FOSER' },
      { url: 'https://www.econcours.gov.bf/categorie-concours', source: 'ECONCOURS' }
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
        
        const mappedOpportunities = opportunities.map(opp => ({
          ...opp,
          type: source === 'ECONCOURS' ? 'concours' : opp.type
        }));
        
        if (mappedOpportunities.length > 0) {
          const syncResult = await governmentOpportunityService.syncWithSource(source as any, mappedOpportunities as any);
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

    // Also sync career opportunities
    try {
      console.log('Gathering started for CareerSync...');
      const careerResults = await careerGatheringService.crawlOpportunities();
      console.log('Career results:', careerResults);
      if (careerResults.addedOpportunities && careerResults.addedOpportunities.length > 0) {
        console.log(`Syncing ${careerResults.addedOpportunities.length} opportunities...`);
        const syncResults = await governmentOpportunityService.syncCareerOpportunitiesToGov(careerResults.addedOpportunities);
        results.added += syncResults.added;
        results.updated += syncResults.updated;
        console.log('Sync results:', syncResults);
      }
    } catch (error: any) {
      console.error('Error gathering from CareerSync:', error);
      results.errors.push(`CareerSync: ${error.message}`);
    }

    return results;
  },

  /**
   * Specifically gather, search and sync public competitions from eConcours
   */
  async gatherEconcoursOnly() {
    const url = 'https://www.econcours.gov.bf/categorie-concours';
    const source = 'ECONCOURS';
    try {
      console.log(`Gathering started for ${source} specifically...`);
      const { content } = await this.fetchSourceContent(url);
      
      // Analyze content with Gemini
      const opportunities = await analyzeGovernmentContent(content, url, source);
      
      const mappedOpportunities = opportunities.map(opp => ({
        ...opp,
        type: 'concours' as any, // Force the type to 'concours'
        source: 'ECONCOURS',
        isVerified: true
      }));
      
      if (mappedOpportunities.length > 0) {
        const syncResult = await governmentOpportunityService.syncWithSource(source, mappedOpportunities as any);
        return {
          added: syncResult.added,
          updated: syncResult.updated,
          opportunities: mappedOpportunities,
          error: null
        };
      }
      return { added: 0, updated: 0, opportunities: [], error: null };
    } catch (error: any) {
      console.error(`Error gathering specifically from ${source}:`, error);
      throw error;
    }
  }
};
