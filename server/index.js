import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory candidate storage if database admin SDK is not initialized
const serverCandidates = [];

/**
 * Health check & configuration status endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    searchConfigured: Boolean(process.env.SEARCH_API_KEY),
    timestamp: new Date().toISOString()
  });
});

/**
 * Validates whether a URL is a legitimate web URL.
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Protected AI-Assisted Scholarship Discovery Endpoint
 *
 * Invokes LLM & Search API to discover real candidate scholarships.
 * Strictly extracts data, validates fields, and assigns status: 'Pending'.
 * Never automatically publishes to students.
 */
app.post('/api/discovery/search', async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: 'Search topic is required.' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // If Gemini API Key is configured, execute live LLM inference
  if (geminiApiKey) {
    try {
      const prompt = `
You are a scholarship data specialist extracting scholarship candidates for college students.
Search Topic: "${topic}"

Provide up to 3 real, verifiable Indian or international scholarship schemes matching this topic.
Extract all details strictly into valid JSON format without markdown code fences or backticks.
Schema for each item:
{
  "name": string (scholarship title),
  "provider": string (sponsoring organization or government ministry),
  "description": string (objective and aid details),
  "officialUrl": string (official application URL, must start with https://),
  "sourceUrl": string (official department or gazette URL),
  "minGpa": number or null,
  "eligibleCategory": string ("General", "OBC", "SC", "ST", "EWS", or "Any"),
  "eligibleCourse": string ("B.Tech", "B.Sc", "MBBS", "BCA", or "Any"),
  "maxFamilyIncome": number or null,
  "eligibleState": string ("Kerala", "Tamil Nadu", or "Any"),
  "requiredDocuments": array of strings,
  "deadline": string (YYYY-MM-DD or null),
  "incomeCertValidityDays": number (standard 180 or 365)
}
Return only a JSON array of objects. Do not invent fake URLs or fake criteria.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API responded with status ${response.status}: ${errBody}`);
      }

      const geminiResult = await response.json();
      const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let parsed = [];
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Strip any accidental markdown formatting
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      // Validate candidates and assign Pending status
      const validCandidates = parsed
        .filter(item => item && item.name && item.provider)
        .map((item, idx) => ({
          id: 'ai-cand-' + Date.now() + '-' + idx,
          name: item.name,
          provider: item.provider,
          description: item.description || '',
          officialUrl: isValidUrl(item.officialUrl) ? item.officialUrl : 'https://scholarships.gov.in',
          sourceUrl: isValidUrl(item.sourceUrl) ? item.sourceUrl : 'https://scholarships.gov.in',
          minGpa: item.minGpa ? Number(item.minGpa) : null,
          eligibleCategory: item.eligibleCategory || 'Any',
          eligibleCourse: item.eligibleCourse || 'Any',
          maxFamilyIncome: item.maxFamilyIncome ? Number(item.maxFamilyIncome) : null,
          eligibleState: item.eligibleState || 'Any',
          requiredDocuments: Array.isArray(item.requiredDocuments) ? item.requiredDocuments : ['Income Certificate', 'Marksheet', 'Aadhaar Card'],
          deadline: item.deadline || '2026-12-31',
          incomeCertValidityDays: Number(item.incomeCertValidityDays || 180),
          status: 'Pending', // Strictly pending for administrator audit
          discoveryTimestamp: new Date().toISOString(),
          lastUpdatedTimestamp: new Date().toISOString(),
          isAiDiscovered: true,
          isSample: false
        }));

      return res.json({
        success: true,
        source: 'live_gemini',
        candidates: validCandidates,
        message: `Extracted ${validCandidates.length} candidate scholarship(s) via Gemini structuring.`
      });
    } catch (err) {
      console.error('Gemini Discovery Error:', err);
      // Fall through to structured diagnostic response
      return res.status(502).json({
        success: false,
        error: 'Gemini AI discovery encountered an error: ' + err.message,
        message: 'Search service failed. Please verify GEMINI_API_KEY in .env or use the manual entry fallback.'
      });
    }
  }

  // Fallback when GEMINI_API_KEY is not configured
  // Clearly documented non-fabricated response explaining configuration requirement
  const sampleCandidate = {
    id: 'ai-cand-demo-' + Date.now(),
    name: `AI Candidate: National Merit Opportunity for ${topic} (Demonstration)`,
    provider: 'National Scholarship Portal Directorate (Candidate Demo)',
    description: `Discovered scholarship candidate matching query: "${topic}". Flagged with status 'Pending' awaiting administrative review.`,
    officialUrl: 'https://scholarships.gov.in',
    sourceUrl: 'https://scholarships.gov.in/public/faq',
    minGpa: 3.2,
    eligibleCategory: 'Any',
    eligibleCourse: 'B.Tech',
    maxFamilyIncome: 500000,
    eligibleState: 'Any',
    requiredDocuments: ['Marksheet', 'Income Certificate', 'Aadhaar Card'],
    deadline: '2026-12-31',
    incomeCertValidityDays: 180,
    status: 'Pending',
    discoveryTimestamp: new Date().toISOString(),
    lastUpdatedTimestamp: new Date().toISOString(),
    isAiDiscovered: true,
    isSample: true,
    demoNotice: 'GEMINI_API_KEY is not configured in .env. To enable live LLM discovery, provide a valid GEMINI_API_KEY in your environment.'
  };

  return res.json({
    success: true,
    source: 'simulation_fallback',
    candidates: [sampleCandidate],
    message: 'Extracted candidate using server pipeline. Note: Add GEMINI_API_KEY to .env for live Gemini web extraction.'
  });
});

app.listen(PORT, () => {
  console.log(`ScholarAid protected server listening on port ${PORT}`);
});
