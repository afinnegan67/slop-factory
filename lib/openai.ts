import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runDeepResearch(topic: string, targetAudience: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a world-class market researcher specializing in understanding the deep emotional pain points of ${targetAudience}. 

Your job is to uncover the visceral, emotional, day-to-day frustrations that keep these people up at night. Go beyond surface-level problems to find the REAL pain - the moments of anger, frustration, embarrassment, and defeat.

Focus on:
- Specific scenarios that trigger frustration
- The emotional toll of these problems
- What they lose (money, time, relationships, reputation)
- The internal dialogue they have when dealing with these issues
- The ripple effects on their family and personal life

Be specific and vivid. Use real language they would use.`
      },
      {
        role: 'user',
        content: `Conduct comprehensive research on the pain points of ${targetAudience} related to: "${topic}"

Provide a detailed report covering:

1. **TOP 10 PAIN POINTS** - Ranked by emotional intensity
   - Each with a specific scenario
   - The visceral emotional response
   - What they lose (quantify when possible)

2. **DAY-IN-THE-LIFE SCENARIOS**
   - Morning frustrations
   - On-the-job pain moments
   - Evening/family impact
   - Weekend intrusions

3. **MONEY PAIN**
   - How they lose money to this problem
   - Specific dollar amounts when possible
   - The "working for free" moments

4. **TIME PAIN**
   - Hours lost per week
   - What they sacrifice
   - The "never-ending" feeling

5. **RELATIONSHIP PAIN**
   - Impact on spouse/family
   - Missing important moments
   - The guilt and shame

6. **IDENTITY/PRIDE PAIN**
   - How it makes them feel about themselves
   - Professional embarrassment
   - Imposter syndrome triggers

7. **VISCERAL PHRASES**
   - The actual words they use
   - Their internal dialogue
   - Things they'd say to a friend

Be extremely detailed and specific. This research will be used to create advertising that truly resonates.`
      }
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

export async function extractPainAngles(researchReport: string): Promise<{
  title: string;
  description: string;
  visceral_phrase: string;
  category: string;
  intensity_score: number;
}[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at distilling market research into punchy, visceral pain angles for advertising.

Your job is to extract the most emotionally powerful pain points and turn them into angles that will STOP someone mid-scroll.

Each pain angle should:
- Be immediately relatable
- Trigger an emotional response
- Be specific (not generic)
- Include a "visceral phrase" - the punchy version that could be a headline`
      },
      {
        role: 'user',
        content: `Extract the top pain angles from this research report. Return as JSON array.

RESEARCH REPORT:
${researchReport}

Return a JSON array with this exact structure:
[
  {
    "title": "Short title (3-5 words)",
    "description": "Full description of the pain point (2-3 sentences)",
    "visceral_phrase": "Punchy headline version (e.g., 'Handshake = $10k loss')",
    "category": "financial|time|family|stress|reputation",
    "intensity_score": 1-10
  }
]

Extract 8-12 pain angles, ranked by intensity_score (highest first).
Return ONLY the JSON array, no other text.`
      }
    ],
    max_tokens: 2000,
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content || '[]';
  
  try {
    // Clean up the response - remove markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse pain angles:', content);
    return [];
  }
}

export async function generateVisualHook(painAngle: {
  title: string;
  description: string;
  visceral_phrase: string;
}): Promise<{
  scene_description: string;
  scene_setting: string;
  scene_mood: string;
  headline_text: string;
  subheadline_text: string;
  cta_text: string;
  spoken_script: string;
  voice_tone: string;
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a creative director for high-converting video ads targeting contractors.

Your job is to create visual hooks that:
1. STOP the scroll in the first 2 seconds
2. Create immediate emotional recognition
3. Set up the pain before the solution

You understand that contractors scroll Facebook late at night, tired after long days. Your visuals need to make them think "that's ME" instantly.`
      },
      {
        role: 'user',
        content: `Create a visual hook package for this pain angle:

TITLE: ${painAngle.title}
DESCRIPTION: ${painAngle.description}
VISCERAL PHRASE: ${painAngle.visceral_phrase}

Return a JSON object with:
{
  "scene_description": "Detailed visual description for AI video generation (Sora). Be specific about: setting, lighting, person's body language, facial expression, props, camera angle. 2-3 sentences.",
  "scene_setting": "job_site|home|office|truck|client_meeting",
  "scene_mood": "frustrated|defeated|angry|exhausted|hopeful",
  "headline_text": "Bold text to appear on screen (max 6 words)",
  "subheadline_text": "Supporting text (max 10 words)",
  "cta_text": "Call to action (e.g., 'Watch how to fix this')",
  "spoken_script": "What the voiceover says (15-20 words, conversational, empathetic)",
  "voice_tone": "empathetic|urgent|conversational|authoritative"
}

Return ONLY the JSON object, no other text.`
      }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || '{}';
  
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse visual hook:', content);
    return {
      scene_description: '',
      scene_setting: 'job_site',
      scene_mood: 'frustrated',
      headline_text: '',
      subheadline_text: '',
      cta_text: '',
      spoken_script: '',
      voice_tone: 'empathetic'
    };
  }
}

