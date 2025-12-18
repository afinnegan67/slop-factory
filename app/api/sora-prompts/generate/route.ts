import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

export async function POST(request: NextRequest) {
  try {
    const { script, hook_brief, product } = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the generation in the background
    (async () => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: '🎬 Generating 3 Sora video prompts...' })}\n\n`));

        const systemPrompt = `You are an expert AI video prompt engineer specializing in creating prompts for Sora 2 Pro video generation.

CRITICAL RULES FOR SORA PROMPTS:
1. NEVER include any overlayed text, titles, captions, or on-screen text in your prompts
2. The ONLY text allowed is text that naturally appears IN THE ENVIRONMENT (signs, screens, tablets, phones, documents that characters are looking at)
3. Focus on VISUAL STORYTELLING - show emotions through body language, facial expressions, lighting, and cinematography
4. Be extremely specific about: camera angles, lighting, mood, character actions, setting details, time of day
5. Each prompt should be 3-5 sentences of vivid, cinematic description
6. Target audience: residential contractors - show realistic jobsite, truck, home office, or client meeting scenarios

VIDEO STYLE GUIDELINES:
- Cinematic, professional quality
- Realistic lighting (golden hour, harsh midday sun, dim evening)
- Handheld or steady cam as appropriate for the mood
- Focus on authentic contractor scenarios`;

        const userPrompt = `Based on this ad script, generate 3 Sora video prompts:

SCRIPT:
- Visceral Hook: ${script.visceral_hook}
- Pain Elaboration: ${script.pain_elaboration}
- Solution Intro: ${script.solution_intro}
- Product Pitch: ${script.product_pitch}
- Price Reveal: ${script.price_reveal}
- CTA: ${script.cta}

${hook_brief ? `HOOK BRIEF CONTEXT:
- Visual Description: ${hook_brief.visual_description}
- Spoken Hook: ${hook_brief.spoken_hook}` : ''}

${product ? `PRODUCT: ${product.name}` : ''}

Generate exactly 3 Sora prompts as a JSON object:

{
  "visual_hook": {
    "prompt": "Detailed Sora prompt for the opening visual hook video (5 seconds). This is the STOP-THE-SCROLL moment. Show the contractor in a visceral, relatable pain moment. NO TEXT OVERLAYS.",
    "duration_seconds": 5,
    "purpose": "Brief description of what this video accomplishes"
  },
  "pain_story": {
    "prompt": "Detailed Sora prompt for the second video (5-7 seconds). This continues the story, showing the contractor dealing with the problem or transitioning to hope. Show emotion through visuals. NO TEXT OVERLAYS.",
    "duration_seconds": 6,
    "purpose": "Brief description of what this video accomplishes"
  },
  "cta_closer": {
    "prompt": "Detailed Sora prompt for the CTA video (4-5 seconds). Show the contractor taking action - picking up phone, tapping a screen, looking hopeful/relieved. End on an aspirational note. NO TEXT OVERLAYS.",
    "duration_seconds": 5,
    "purpose": "Brief description of what this video accomplishes"
  }
}

REMEMBER: NO overlayed text, titles, or captions in any prompt. Only environmental text (signs, screens) if absolutely necessary.

Return ONLY the JSON object, no other text or markdown.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.8,
          stream: true,
        });

        let fullContent = '';

        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'generation_chunk', content })}\n\n`));
          }
        }

        // Parse the complete response
        try {
          const cleaned = fullContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const prompts = JSON.parse(cleaned);
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            message: '✅ Generated 3 Sora prompts!',
            prompts
          })}\n\n`));
        } catch (parseError) {
          console.error('Failed to parse Sora prompts:', parseError);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Failed to parse generated prompts'
          })}\n\n`));
        }

      } catch (error) {
        console.error('Sora prompt generation error:', error);
        const message = error instanceof Error ? error.message : 'Generation failed';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in Sora prompt generation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
