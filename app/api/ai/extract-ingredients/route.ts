import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const authClient = createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    const firebaseUserId = request.headers.get('x-user-id')
    const userId = user?.id || firebaseUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const response = await llmOrchestrator.chat([
      {
        role: 'system',
        content: `You are an ingredient extractor. Given a message about recipes or food, extract ONLY the ingredient names as a simple list.

Rules:
- Return one ingredient per line, nothing else
- Use simple, searchable names (e.g. "chicken breast" not "2 lbs boneless skinless chicken breast")
- Remove quantities, measurements, prices, descriptions, and cooking instructions
- Remove parenthetical info like "(diced)" or "(1:1 ratio)"
- Remove descriptors after dashes like "— healthy fats" or "— creamy"
- Do NOT include recipe names, cooking steps, tips, or cost info
- Do NOT include non-food items
- Maximum 15 ingredients
- If no ingredients found, return "NONE"`,
      },
      {
        role: 'user',
        content,
      },
    ], {
      taskType: 'title_generation', // lightweight task
      userId,
      maxTokens: 200,
      temperature: 0.1,
    })

    const text = response.content.trim()

    if (text === 'NONE' || !text) {
      return NextResponse.json({ ingredients: [] })
    }

    const ingredients = text
      .split('\n')
      .map(line => line.replace(/^[-•*)\s]+/, '').replace(/^\d+\.\s+/, '').trim())
      .filter(line => line.length > 1 && line.length < 50 && line.toLowerCase() !== 'none')
      .slice(0, 15)

    return NextResponse.json({ ingredients })
  } catch (error) {
    console.error('[Extract Ingredients] Error:', error)
    return NextResponse.json({ error: 'Failed to extract ingredients' }, { status: 500 })
  }
}
