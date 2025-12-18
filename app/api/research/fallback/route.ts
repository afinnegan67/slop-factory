import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fallback research using GPT-4o if deep research models aren't available
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { topic, targetAudience = 'residential contractors' } = await request.json();

        if (!topic) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Topic is required' })}\n\n`));
          controller.close();
          return;
        }

        if (!process.env.OPENAI_API_KEY) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' })}\n\n`));
          controller.close();
          return;
        }

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'starting', message: '🚀 Starting research (GPT-4o mode)...' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'researching', message: '🔬 Analyzing contractor pain points...' })}\n\n`));

        let fullResearch = '';
        
        const researchStream = await openai.chat.completions.create({
          model: 'gpt-4o',
          stream: true,
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

        for await (const chunk of researchStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResearch += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'research_chunk', content })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'extracting', message: '🎯 Extracting visceral pain points from research...' })}\n\n`));

        const extractionResponse = await openai.chat.completions.create({
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
- Include a "visceral trigger" - the specific moment that causes the pain`
            },
            {
              role: 'user',
              content: `Extract the top pain points from this research report. Return as JSON array.

RESEARCH REPORT:
${fullResearch}

Return a JSON array with this exact structure:
[
  {
    "title": "Short title (3-5 words)",
    "description": "Full description of the pain point (2-3 sentences)",
    "visceral_trigger": "Specific moment/scenario that triggers this pain",
    "emotional_impact_score": 1-10
  }
]

Extract 8-12 pain points, ranked by emotional_impact_score (highest first).
Return ONLY the JSON array, no other text.`
            }
          ],
          max_tokens: 2000,
          temperature: 0.5,
        });

        const extractedContent = extractionResponse.choices[0]?.message?.content || '[]';
        
        let painPoints = [];
        try {
          const cleaned = extractedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          painPoints = JSON.parse(cleaned);
        } catch (e) {
          console.error('Failed to parse pain points:', extractedContent);
          painPoints = [];
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'pain_points', data: painPoints })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'complete', message: '✅ Research complete!' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', research: fullResearch, pain_points: painPoints })}\n\n`));
        
        controller.close();
      } catch (error) {
        console.error('Research error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

