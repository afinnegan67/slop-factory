import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { research } = await request.json();

    if (!research || typeof research !== 'string') {
      return NextResponse.json({ error: 'Research text is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at distilling market research into punchy, visceral pain angles for advertising.

Your job is to extract the most emotionally powerful pain points from deep research and turn them into angles that will STOP someone mid-scroll on Facebook.

Each pain point should:
- Be immediately relatable to residential contractors
- Trigger a strong emotional response (anger, frustration, recognition)
- Be specific (not generic)
- Include a "visceral trigger" - the specific moment/scenario that causes the pain

Focus on:
- Money lost / working for free
- Time stolen from family
- Late nights doing paperwork
- Client frustrations
- Professional embarrassment
- Scope creep disasters`
        },
        {
          role: 'user',
          content: `Extract the top pain points from this deep research report. Return as a JSON array.

RESEARCH REPORT:
${research}

Return a JSON array with this exact structure:
[
  {
    "title": "Short punchy title (3-5 words)",
    "description": "Full description of the pain point (2-3 sentences that really paint the picture)",
    "visceral_trigger": "The specific moment/scenario that triggers this pain (e.g., 'Sitting at the kitchen table at 11pm doing change orders while your kid's soccer game plays on the DVR')",
    "emotional_impact_score": 1-10
  }
]

Extract 8-12 of the BEST pain points, ranked by emotional_impact_score (highest first).
Focus on the most visceral, specific, emotionally-charged pain points.
Return ONLY the JSON array, no other text or markdown.`
        }
      ],
      max_tokens: 3000,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    let painPoints = [];
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      painPoints = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse pain points:', content);
      return NextResponse.json({ 
        error: 'Failed to parse extracted pain points',
        raw_response: content 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      pain_points: painPoints,
      count: painPoints.length
    });
  } catch (error) {
    console.error('Extraction error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

