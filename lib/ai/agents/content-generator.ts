/**
 * Content Generation Agent
 * Generates marketing content, blog posts, email copy, and social media posts.
 */

import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

export type ContentType = 'blog_post' | 'email' | 'social_media' | 'product_description' | 'newsletter'

export interface ContentRequest {
  type: ContentType
  topic: string
  tone?: 'professional' | 'casual' | 'exciting' | 'educational'
  length?: 'short' | 'medium' | 'long'
  targetAudience?: string
  keywords?: string[]
  additionalContext?: string
}

export interface GeneratedContent {
  type: ContentType
  title: string
  content: string
  summary: string
  suggestedTags: string[]
  wordCount: number
}

const CONTENT_PROMPTS: Record<ContentType, string> = {
  blog_post: `Write a blog post for a grocery price comparison platform called Julyu. The post should be informative, engaging, and include practical tips. Include a catchy title, intro paragraph, 3-5 main sections with subheadings, and a conclusion with a call-to-action.`,
  email: `Write a marketing email for Julyu, a grocery price comparison app. Include a subject line, preview text, main body with a clear value proposition, and a call-to-action button text. Keep it concise and scannable.`,
  social_media: `Write a social media post for Julyu, a grocery savings app. Include the post text (under 280 characters for Twitter), a longer version for Facebook/LinkedIn, and suggested hashtags. Make it engaging and shareable.`,
  product_description: `Write a product feature description for Julyu's website. Highlight the benefit to users, explain how it works in simple terms, and include a brief call-to-action. Keep it concise and benefit-focused.`,
  newsletter: `Write a weekly newsletter section for Julyu users. Include a friendly greeting, 2-3 grocery savings tips, a featured deal or product highlight, and a section on new app features. Keep the tone helpful and conversational.`,
}

const LENGTH_TOKENS: Record<string, number> = {
  short: 500,
  medium: 1000,
  long: 2000,
}

/**
 * Generate content using LLM.
 */
export async function generateContent(
  request: ContentRequest,
  userId: string
): Promise<GeneratedContent> {
  const systemPrompt = CONTENT_PROMPTS[request.type]
  const maxTokens = LENGTH_TOKENS[request.length || 'medium']

  let userPrompt = `Topic: ${request.topic}\n`
  if (request.tone) userPrompt += `Tone: ${request.tone}\n`
  if (request.targetAudience) userPrompt += `Target audience: ${request.targetAudience}\n`
  if (request.keywords && request.keywords.length > 0) {
    userPrompt += `Keywords to include: ${request.keywords.join(', ')}\n`
  }
  if (request.additionalContext) {
    userPrompt += `Additional context: ${request.additionalContext}\n`
  }

  userPrompt += `\nReturn JSON with: title, content (full text with markdown formatting), summary (1-2 sentences), suggestedTags (array of 3-5 tags)`

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const response = await llmOrchestrator.chat(messages, {
    taskType: 'content_generation',
    userId,
    maxTokens,
    temperature: 0.7,
  })

  // Parse JSON response
  let parsed: { title: string; content: string; summary: string; suggestedTags: string[] }
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)?.[0]
    parsed = jsonMatch ? JSON.parse(jsonMatch) : {
      title: request.topic,
      content: response.content,
      summary: response.content.substring(0, 150),
      suggestedTags: [],
    }
  } catch {
    parsed = {
      title: request.topic,
      content: response.content,
      summary: response.content.substring(0, 150),
      suggestedTags: [],
    }
  }

  const wordCount = parsed.content.split(/\s+/).length

  return {
    type: request.type,
    title: parsed.title,
    content: parsed.content,
    summary: parsed.summary,
    suggestedTags: parsed.suggestedTags,
    wordCount,
  }
}
