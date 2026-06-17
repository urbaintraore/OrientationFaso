import { StudentProfile, AnalysisResult, PostBacProfile, UniversityAnalysisResult, Scholarship, GovernmentOpportunity } from "../types";

const API_BASE = '/api/gemini';

export async function analyzeProfile(profile: StudentProfile): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/analyze-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to analyze profile");
  }
  return response.json();
}

export async function analyzePostBacProfile(profile: PostBacProfile, dbCareersContext?: string): Promise<UniversityAnalysisResult> {
  const response = await fetch(`${API_BASE}/analyze-postbac-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, dbCareersContext })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to analyze post-bac profile");
  }
  return response.json();
}

export async function analyzeScholarship(rawContent: string): Promise<Partial<Scholarship>> {
  const response = await fetch(`${API_BASE}/analyze-scholarship`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawContent })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to analyze scholarship");
  }
  return response.json();
}

export async function crawlInstitutions(region: string): Promise<any[]> {
  const response = await fetch(`${API_BASE}/crawl-institutions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to crawl institutions");
  }
  return response.json();
}

export async function crawlScholarshipMarket(academicYears: string[] = ['2025/2026', '2026/2027']): Promise<{ data: any[], report: any }> {
  const response = await fetch(`${API_BASE}/crawl-scholarship-market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ academicYears })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to crawl scholarship market");
  }
  return response.json();
}

export async function analyzeGovernmentContent(content: string, url: string, source: string): Promise<Omit<GovernmentOpportunity, 'id' | 'createdAt' | 'updatedAt'>[]> {
  const response = await fetch(`${API_BASE}/analyze-government-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, url, source })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to analyze government content");
  }
  return response.json();
}

export async function crawlCareerOpportunities(targetKeyword: string): Promise<any> {
  const response = await fetch(`${API_BASE}/crawl-career-opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetKeyword })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to crawl career opportunities");
  }
  return response.json();
}
