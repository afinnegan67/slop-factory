import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { pain_point_id, product_id } = await request.json();

        if (!pain_point_id || !product_id) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'pain_point_id and product_id are required' })}\n\n`));
          controller.close();
          return;
        }

        if (!process.env.OPENAI_API_KEY) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'OpenAI API key not configured' })}\n\n`));
          controller.close();
          return;
        }

        // Fetch pain point and product
        const [painPointRes, productRes] = await Promise.all([
          supabase.from('pain_points').select('*').eq('id', pain_point_id).single(),
          supabase.from('products').select('*').eq('id', product_id).single()
        ]);

        if (painPointRes.error || !painPointRes.data) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Pain point not found' })}\n\n`));
          controller.close();
          return;
        }

        if (productRes.error || !productRes.data) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Product not found' })}\n\n`));
          controller.close();
          return;
        }

        const painPoint = painPointRes.data;
        const product = productRes.data;

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'starting', message: '🎬 Starting hook brief generation...' })}\n\n`));

        const generationPrompt = `Generate 10 unique video ad hook concepts for this pain point + product combination.

PAIN POINT:
- Title: ${painPoint.title}
- Description: ${painPoint.description}
- Visceral Trigger: ${painPoint.visceral_trigger}
- Emotional Impact: ${painPoint.emotional_impact_score}/10

PRODUCT:
- Name: ${product.name}
- Price: $${(product.price_cents / 100).toFixed(2)}
- Value Proposition: ${product.value_proposition}
- Key Features: ${JSON.stringify(product.key_features || {})}
- Guarantees: ${(product.guarantees || []).join(', ')}

TARGET AUDIENCE: Residential contractors who scroll Facebook late at night after exhausting days.

For each hook concept, create a complete brief with:
1. A catchy title (3-5 words)
2. Visual description (what we see in the first 3 seconds - be specific about setting, lighting, body language)
3. Spoken hook (first 5-7 words the voiceover says - must stop the scroll)
4. Text overlay (bold text that appears on screen - max 6 words)
5. Copy super (supporting text below - max 10 words)

Make each concept DIFFERENT:
- Vary the emotional angle (anger, frustration, defeat, hope, vindication)
- Vary the scenario (job site, home office, truck, client meeting)
- Vary the visual style (close-up, wide shot, POV, slow-motion)
- Vary the hook approach (question, statement, statistic, story start)

Return as JSON array:
[
  {
    "title": "...",
    "visual_description": "...",
    "spoken_hook": "...",
    "text_overlay": "...",
    "copy_super": "..."
  }
]

Return ONLY the JSON array, no other text.`;

        // Create batch record
        const { data: batch, error: batchError } = await supabase
          .from('hook_brief_batches')
          .insert({
            pain_point_id,
            product_id,
            generation_prompt: generationPrompt
          })
          .select()
          .single();

        if (batchError) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to create batch record' })}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', stage: 'generating', message: '✨ Generating 10 unique hook concepts...' })}\n\n`));

        // Generate hook briefs
        let fullResponse = '';
        const briefStream = await openai.chat.completions.create({
          model: 'gpt-4o',
          stream: true,
          messages: [
            {
              role: 'system',
              content: `You are a world-class creative director specializing in high-converting Facebook video ads for contractors. Your hooks STOP the scroll and make contractors think "that's ME" in the first 2 seconds. You understand that contractors are tired, frustrated, and skeptical - your hooks cut through the noise with raw emotional truth.`
            },
            {
              role: 'user',
              content: generationPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.9, // Higher temperature for more diverse concepts
        });

        for await (const chunk of briefStream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generation_chunk', content })}\n\n`));
          }
        }

        // Parse the hook briefs
        let hookBriefs = [];
        try {
          const cleaned = fullResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          hookBriefs = JSON.parse(cleaned);
        } catch (e) {
          console.error('Failed to parse hook briefs:', fullResponse);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse generated briefs' })}\n\n`));
          controller.close();
          return;
        }

        // Return the generated briefs WITHOUT saving to database
        // User will select which ones to save via the "Store Hook Briefs" button
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          batch_id: batch.id,
          pain_point: painPoint,
          product: product,
          hook_briefs: hookBriefs.map((brief: {
            title: string;
            visual_description: string;
            spoken_hook: string;
            text_overlay: string;
            copy_super: string;
          }, index: number) => ({
            temp_id: `temp_${batch.id}_${index}`, // Temporary ID for frontend tracking
            batch_id: batch.id,
            title: brief.title,
            visual_description: brief.visual_description,
            spoken_hook: brief.spoken_hook,
            text_overlay: brief.text_overlay,
            copy_super: brief.copy_super,
            ai_generated_version: brief,
            product_name: product.name // Include product name for display
          })),
          message: '✅ Generated 10 hook briefs! Select the ones you want to save.' 
        })}\n\n`));
        
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
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

