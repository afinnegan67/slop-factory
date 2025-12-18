import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

export async function POST(request: NextRequest) {
  try {
    const { hook_brief, product, pain_point } = await request.json();

    if (!hook_brief) {
      return NextResponse.json({ error: 'Hook brief is required' }, { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the generation in the background
    (async () => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: '🎬 Generating 6-section ad script...' })}\n\n`));

        const systemPrompt = `You are an expert direct-response copywriter specializing in high-converting Facebook video ads for contractors.

You write scripts that:
- Hook viewers in the first 2 seconds
- Agitate the pain point with visceral, relatable scenarios
- Transition smoothly to the solution
- Present the product as the obvious answer
- Handle price objection with value framing
- Close with urgency and clear CTA

Your scripts are conversational, punchy, and sound like a friend giving advice - not salesy or corporate.`;

        const userPrompt = `Create a 6-section video ad script based on this hook brief:

HOOK BRIEF:
- Title: ${hook_brief.title}
- Visual Description: ${hook_brief.visual_description}
- Spoken Hook: ${hook_brief.spoken_hook}
- Text Overlay: ${hook_brief.text_overlay}
- Copy Super: ${hook_brief.copy_super}

${product ? `PRODUCT INFO:
- Name: ${product.name}
- Price: $${(product.price_cents / 100).toLocaleString()}
- Value Proposition: ${product.value_proposition}
- Guarantees: ${product.guarantees?.join(', ') || 'Lifetime access'}` : ''}

${pain_point ? `PAIN POINT CONTEXT:
- Title: ${pain_point.title}
- Description: ${pain_point.description}
- Visceral Trigger: ${pain_point.visceral_trigger}` : ''}

Generate a complete 6-section ad script. Each section should be 2-4 sentences that flow naturally when spoken.

Return as a JSON object with this EXACT structure:
{
  "visceral_hook": "Opening hook that stops the scroll. Use the spoken hook as inspiration but expand it. Make them feel seen in 2 seconds.",
  "pain_elaboration": "Dig deeper into the pain. Paint a specific scenario they've lived. Use 'you' language. Make them nod in recognition.",
  "solution_intro": "Transition from pain to hope. Hint that there's a better way. Build curiosity without revealing yet.",
  "product_pitch": "Introduce the product as the answer. Focus on transformation, not features. What life looks like after.",
  "price_reveal": "Handle the price objection before they have it. Frame value vs cost. Compare to what they're losing now.",
  "cta": "Clear, urgent call to action. Tell them exactly what to do. Add scarcity or urgency if natural.",
  "full_script": "The complete script as one flowing piece (all 6 sections combined)",
  "estimated_duration_seconds": 45
}

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
          const script = JSON.parse(cleaned);
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            message: '✅ Script generated successfully!',
            script
          })}\n\n`));
        } catch (parseError) {
          console.error('Failed to parse script:', parseError);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Failed to parse generated script'
          })}\n\n`));
        }

      } catch (error) {
        console.error('Script generation error:', error);
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
    console.error('Error in script generation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
