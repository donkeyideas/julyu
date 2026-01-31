/**
 * Pricing Strategy Agent
 * Analyzes platform pricing data and provides strategic recommendations
 * for subscription tiers, feature gating, and revenue optimization.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { llmOrchestrator } from '@/lib/llm/orchestrator'
import type { LLMMessage } from '@/types/llm'

export interface PricingAnalysis {
  userMetrics: {
    totalUsers: number
    freeUsers: number
    premiumUsers: number
    enterpriseUsers: number
    conversionRate: number
  }
  revenueMetrics: {
    aiCostPerUser: number
    totalAiCost: number
    avgApiCallsPerUser: number
    heavyUsers: number // Users exceeding average by 2x+
  }
  featureUsage: {
    feature: string
    usageCount: number
    uniqueUsers: number
    pctOfTotal: number
  }[]
  recommendations: string[]
}

/**
 * Run pricing strategy analysis.
 */
export async function analyzePricingStrategy(): Promise<PricingAnalysis> {
  const supabase = createServiceRoleClient() as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // User counts by tier
  const { data: users } = await supabase
    .from('users')
    .select('id, subscription_tier')

  const userRows = (users ?? []) as Array<{ id: string; subscription_tier: string }>
  const totalUsers = userRows.length
  const freeUsers = userRows.filter(u => u.subscription_tier === 'free').length
  const premiumUsers = userRows.filter(u => u.subscription_tier === 'premium').length
  const enterpriseUsers = userRows.filter(u => u.subscription_tier === 'enterprise').length
  const conversionRate = totalUsers > 0 ? (premiumUsers + enterpriseUsers) / totalUsers : 0

  // AI usage costs
  const { data: aiUsage } = await supabase
    .from('ai_model_usage')
    .select('user_id, cost, use_case')
    .gte('created_at', thirtyDaysAgo)

  const usageRows = (aiUsage ?? []) as Array<{
    user_id: string | null; cost: number | null; use_case: string | null
  }>

  const totalAiCost = usageRows.reduce((s, u) => s + (u.cost || 0), 0)
  const userCosts = new Map<string, number>()
  for (const u of usageRows) {
    if (!u.user_id) continue
    userCosts.set(u.user_id, (userCosts.get(u.user_id) || 0) + (u.cost || 0))
  }

  const aiCostPerUser = userCosts.size > 0 ? totalAiCost / userCosts.size : 0
  const avgCallsPerUser = userCosts.size > 0 ? usageRows.length / userCosts.size : 0

  // Heavy users (>2x average cost)
  const heavyThreshold = aiCostPerUser * 2
  const heavyUsers = Array.from(userCosts.values()).filter(c => c > heavyThreshold).length

  // Feature usage from events
  const { data: events } = await supabase
    .from('user_events')
    .select('event_type, user_id')
    .gte('created_at', thirtyDaysAgo)

  const eventRows = (events ?? []) as Array<{ event_type: string; user_id: string | null }>
  const featureMap = new Map<string, { count: number; users: Set<string> }>()
  for (const e of eventRows) {
    const existing = featureMap.get(e.event_type) || { count: 0, users: new Set() }
    existing.count += 1
    if (e.user_id) existing.users.add(e.user_id)
    featureMap.set(e.event_type, existing)
  }

  const featureUsage = Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature,
      usageCount: data.count,
      uniqueUsers: data.users.size,
      pctOfTotal: totalUsers > 0 ? (data.users.size / totalUsers) * 100 : 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 15)

  // Generate AI recommendations
  const recommendations = await generatePricingRecommendations({
    totalUsers,
    freeUsers,
    premiumUsers,
    conversionRate,
    aiCostPerUser,
    totalAiCost,
    heavyUsers,
    topFeatures: featureUsage.slice(0, 5),
  })

  return {
    userMetrics: {
      totalUsers,
      freeUsers,
      premiumUsers,
      enterpriseUsers,
      conversionRate,
    },
    revenueMetrics: {
      aiCostPerUser,
      totalAiCost,
      avgApiCallsPerUser: avgCallsPerUser,
      heavyUsers,
    },
    featureUsage,
    recommendations,
  }
}

async function generatePricingRecommendations(data: {
  totalUsers: number
  freeUsers: number
  premiumUsers: number
  conversionRate: number
  aiCostPerUser: number
  totalAiCost: number
  heavyUsers: number
  topFeatures: Array<{ feature: string; uniqueUsers: number; pctOfTotal: number }>
}): Promise<string[]> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: `You are a SaaS pricing strategist for a grocery price comparison app. Based on usage data, provide 3-5 specific, actionable pricing recommendations. Focus on: conversion rate optimization, feature gating strategy, and controlling AI costs. Return a JSON array of recommendation strings.`,
    },
    {
      role: 'user',
      content: `Platform data (last 30 days):
- Total users: ${data.totalUsers} (Free: ${data.freeUsers}, Premium: ${data.premiumUsers})
- Conversion rate: ${(data.conversionRate * 100).toFixed(1)}%
- AI cost per active user: $${data.aiCostPerUser.toFixed(4)}
- Total AI cost: $${data.totalAiCost.toFixed(2)}
- Heavy AI users (>2x avg cost): ${data.heavyUsers}
- Most used features: ${data.topFeatures.map(f => `${f.feature} (${f.uniqueUsers} users, ${f.pctOfTotal.toFixed(0)}%)`).join(', ')}

Provide specific pricing and feature-gating recommendations.`,
    },
  ]

  try {
    const response = await llmOrchestrator.chat(messages, {
      taskType: 'spending_analysis',
      userId: 'admin',
      maxTokens: 500,
      temperature: 0.5,
    })

    const jsonMatch = response.content.match(/\[[\s\S]*\]/)?.[0]
    if (jsonMatch) {
      return JSON.parse(jsonMatch)
    }
    return [response.content.trim()]
  } catch {
    return [
      'Consider implementing usage-based pricing for AI features to control costs.',
      'Gate advanced features (meal planning, smart lists) behind premium tier to drive conversions.',
      'Offer a 14-day premium trial to increase free-to-paid conversion.',
    ]
  }
}
