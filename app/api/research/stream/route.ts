import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

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

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'starting', message: '🚀 Initiating OpenAI Deep Research API...' })}\n\n`));

        const researchPrompt = `Research the deep emotional pain points of ${targetAudience} related to: "${topic}"

Do:
- Include specific scenarios, emotional triggers, and visceral moments that frustrate this audience
- Prioritize real-world examples and specific dollar amounts when possible
- Focus on day-to-day frustrations, money lost, time wasted, family impact, and professional embarrassment
- Include the actual language and phrases these people use when frustrated
- Find forum posts, Reddit discussions, and contractor community discussions about these pain points
- Include inline citations and return all source metadata

Provide a comprehensive report covering:

1. **TOP 10 PAIN POINTS** - Ranked by emotional intensity
   - Each with a specific real-world scenario
   - The visceral emotional response (anger, frustration, defeat)
   - Quantified losses (money, time, relationships)

2. **DAY-IN-THE-LIFE SCENARIOS**
   - Morning frustrations before leaving for work
   - On-the-job pain moments
   - Evening/family impact after long days
   - Weekend intrusions on personal time

3. **MONEY PAIN**
   - How they lose money to this problem
   - Specific dollar amounts and examples
   - The "working for free" moments

4. **TIME PAIN**
   - Hours lost per week to this problem
   - What they sacrifice (family, hobbies, health)

5. **RELATIONSHIP PAIN**
   - Impact on spouse/family
   - Missing important moments

6. **VISCERAL PHRASES**
   - The actual words and phrases they use
   - Their internal dialogue when frustrated

Be extremely detailed and specific with real sources.`;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'calling_api', message: '📡 Calling OpenAI Responses API (Deep Research)...' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'calling_api', message: '⏳ Deep Research takes 5-15 minutes. The AI is searching the web...' })}\n\n`));

        // Make direct HTTP request to OpenAI Responses API
        // The SDK might not support this yet, so we use fetch directly
        const apiResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'o4-mini-deep-research',
            input: researchPrompt,
            background: false, // Set to false to wait for completion (will be long)
            tools: [
              { type: 'web_search_preview' }
            ],
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API returned ${apiResponse.status}`;
          
          console.error('OpenAI Responses API error:', errorData);
          
          // Send detailed error back to client
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: `Deep Research API Error: ${errorMessage}`,
            details: errorData
          })}\n\n`));
          controller.close();
          return;
        }

        const responseData = await apiResponse.json();
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'processing', message: '📊 Deep Research complete! Processing results...' })}\n\n`));

        // Get the research output
        const researchOutput = responseData.output_text || '';
        
        if (!researchOutput) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Deep Research returned empty response',
            details: responseData
          })}\n\n`));
          controller.close();
          return;
        }
        
        // Stream the research output in chunks for visual effect
        const chunkSize = 100;
        for (let i = 0; i < researchOutput.length; i += chunkSize) {
          const chunk = researchOutput.slice(i, i + chunkSize);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'research_chunk', content: chunk })}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'extracting', message: '🎯 Extracting pain points from research...' })}\n\n`));

        // Use GPT-4o to extract structured pain points
        const openai = new OpenAI({ apiKey });
        
        const extractionResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert at distilling market research into punchy, visceral pain angles for advertising.

Your job is to extract the most emotionally powerful pain points and turn them into angles that will STOP someone mid-scroll.`
            },
            {
              role: 'user',
              content: `Extract the top pain points from this deep research report. Return as JSON array.

RESEARCH REPORT:
${researchOutput}

Return a JSON array with this exact structure:
[
  {
    "title": "Short title (3-5 words)",
    "description": "Full description of the pain point (2-3 sentences)",
    "visceral_trigger": "The specific moment/scenario that triggers this pain",
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

        // Count web search calls from the response
        const output = responseData.output || [];
        const webSearchCalls = output.filter((item: { type: string }) => item.type === 'web_search_call').length;
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'status', 
          stage: 'complete', 
          message: `✅ Deep Research complete! Found ${painPoints.length} pain points from ${webSearchCalls} web searches.` 
        })}\n\n`));
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          research: researchOutput, 
          pain_points: painPoints, 
          sources_count: webSearchCalls,
          raw_response: responseData 
        })}\n\n`));
        
        controller.close();
      } catch (error) {
        console.error('Deep Research error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          message: `Deep Research failed: ${message}`,
          stack: error instanceof Error ? error.stack : undefined
        })}\n\n`));
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
