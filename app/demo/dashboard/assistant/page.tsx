'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ActionResult {
  success: boolean
  action: string
  message: string
  data?: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: ActionResult[]
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

// Strip [ACTION:...] tags from displayed text so user never sees them
function stripActionTags(text: string): string {
  return text
    .split('\n')
    .filter(line => !/^\s*\[ACTION:(ADD_TO_LIST|SET_ALERT|CHECK_BUDGET|SEARCH_PRICES|FIND_STORES)\]/i.test(line.trim()))
    .join('\n')
}

const SUGGESTED_PROMPTS = [
  "What are some budget-friendly dinner ideas?",
  "Help me create a weekly meal plan",
  "What's a good substitute for butter?",
  "How can I save money on groceries?",
]

// Check if message likely contains a recipe/ingredients
function hasIngredients(content: string): boolean {
  const lowerContent = content.toLowerCase()
  const hasIngredientKeywords =
    lowerContent.includes('ingredient') ||
    lowerContent.includes('you\'ll need') ||
    lowerContent.includes('shopping list') ||
    lowerContent.includes('what you need') ||
    lowerContent.includes('here\'s what') ||
    lowerContent.includes('dinner idea') ||
    lowerContent.includes('recipe') ||
    lowerContent.includes('meal plan') ||
    lowerContent.includes('meal idea') ||
    lowerContent.includes('budget-friendly') ||
    lowerContent.includes('here are') ||
    lowerContent.includes('substitute') ||
    lowerContent.includes('butter alternative') ||
    lowerContent.includes('cost per serving') ||
    lowerContent.includes('cost:') ||
    lowerContent.includes('/serving')

  if (!hasIngredientKeywords) return false

  // Check for bullet points OR numbered recipes with bold ingredients
  const bulletPoints = (content.match(/^\s*[-*•]\s*.+$/gm) || []).length
  const numberedItems = (content.match(/^\d+\.\s+/gm) || []).length
  const boldWords = (content.match(/\*\*[^*]+\*\*/g) || []).length
  return bulletPoints >= 3 || numberedItems >= 2 || boldWords >= 3
}

// Simple markdown renderer
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500">•</span>
              <span>{formatInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
      return
    }

    flushList()

    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />)
      return
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="font-semibold text-sm mt-3 mb-1 text-green-400">
          {formatInlineMarkdown(trimmed.slice(4))}
        </h4>
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="font-bold text-base mt-3 mb-1 text-white">
          {formatInlineMarkdown(trimmed.slice(3))}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="font-bold text-lg mt-3 mb-1 text-white">
          {formatInlineMarkdown(trimmed.slice(2))}
        </h2>
      )
      return
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={index} className="flex gap-2 my-1">
          <span className="text-green-500 font-medium">{numberedMatch[1]}.</span>
          <span>{formatInlineMarkdown(numberedMatch[2])}</span>
        </div>
      )
      return
    }

    elements.push(
      <p key={index} className="my-1">
        {formatInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()
  return <div className="space-y-1">{elements}</div>
}

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index))
      }
      parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
    } else {
      parts.push(remaining)
      break
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'conv-1', title: 'Weekly meal plan ideas', updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'conv-2', title: 'Budget grocery tips', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'conv-3', title: 'Chicken recipe suggestions', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Can you help me plan meals for this week on a budget?',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `Absolutely! Here's a **budget-friendly weekly meal plan** that keeps each dinner under **$3/serving**:

### Monday: One-Pot Chicken & Rice
- **Chicken thighs** (bone-in, ~$1.99/lb)
- **Long grain rice** (1 cup)
- **Onion** (1 medium)
- **Garlic** (3 cloves)
- **Chicken broth** (2 cups)
- **Frozen peas** (1 cup)

Cost: ~$2.50/serving

### Wednesday: Black Bean Tacos
- **Black beans** (1 can, $0.89)
- **Tortillas** (8-pack)
- **Shredded cheese** (1 cup)
- **Salsa** (store brand jar)
- **Lettuce** (1/2 head)
- **Lime** (1)

Cost: ~$1.80/serving

### Friday: Pasta Primavera
- **Spaghetti** (1 lb box)
- **Zucchini** (1 medium)
- **Bell pepper** (1)
- **Cherry tomatoes** (1 pint)
- **Garlic** (2 cloves)
- **Parmesan cheese** (for topping)
- **Olive oil**

Cost: ~$2.20/serving

**Quick Tip:** Buy chicken thighs in bulk when they go on sale and freeze them in portions. This alone can save you $15-20/month!

Would you like me to create a full shopping list with estimated prices from stores near you?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 9),
  },
]

const CONV2_MESSAGES: Message[] = [
  {
    id: 'conv2-msg-1',
    role: 'user',
    content: 'How can I save money on groceries each month?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: 'conv2-msg-2',
    role: 'assistant',
    content: `Here are my top **money-saving grocery strategies** that can save you **$150-300/month**:

### Plan Before You Shop
- **Make a weekly meal plan** before hitting the store
- **Check store flyers** for sales and plan meals around discounts
- **Create a strict shopping list** and stick to it

### Smart Shopping Habits
- **Buy store brands** — they're 20-40% cheaper and often identical quality
- **Shop seasonal produce** — in-season fruits and veggies are 50%+ cheaper
- **Buy in bulk** for non-perishables (rice, beans, pasta, canned goods)
- **Use cashback apps** like Ibotta or Checkout 51

### Reduce Waste
- **Freeze leftovers** in portioned containers for future meals
- **Use vegetable scraps** for homemade broth
- **Check your fridge** before shopping to avoid duplicate purchases

### Price Compare
- **Track prices** at 2-3 stores to know who has the best deals
- **Use Julyu's Compare feature** to instantly compare ingredient prices across stores near you

Would you like me to help you create a budget-friendly meal plan for this week?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 30),
  },
]

const CONV3_MESSAGES: Message[] = [
  {
    id: 'conv3-msg-1',
    role: 'user',
    content: 'Give me a good chicken recipe',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: 'conv3-msg-2',
    role: 'assistant',
    content: `Here's a crowd-favorite recipe that's easy and affordable:

## Crispy Garlic Butter Chicken Thighs

### Ingredients
- **Bone-in chicken thighs** (4 pieces, ~2 lbs)
- **Butter** (3 tablespoons)
- **Garlic** (5 cloves, minced)
- **Lemon** (1, juiced)
- **Fresh thyme** (4 sprigs, or 1 tsp dried)
- **Salt and pepper** to taste
- **Olive oil** (1 tablespoon)

### Instructions
1. Preheat oven to 425°F
2. Season chicken thighs generously with salt and pepper
3. Heat olive oil in an oven-safe skillet over medium-high heat
4. Sear chicken skin-side down for 5-6 minutes until golden and crispy
5. Flip chicken and add butter, garlic, lemon juice, and thyme to the skillet
6. Transfer skillet to the oven and bake 20-25 minutes until internal temp reaches 165°F
7. Baste chicken with pan juices and let rest 5 minutes before serving

**Cost per serving:** ~$2.75

Serve with rice and steamed broccoli for a complete meal under $4/serving!

Would you like me to compare ingredient prices at stores near you?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 30),
  },
]

// Pre-scripted responses based on keywords
function getMockResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes('meal plan') || lower.includes('meal prep') || lower.includes('weekly plan')) {
    return `Here's a **simple 5-day meal plan** to keep things easy and budget-friendly:

### Monday: Chicken Stir-Fry
- **Chicken breast** (1 lb)
- **Broccoli** (2 cups)
- **Soy sauce** (2 tbsp)
- **Rice** (1 cup)
- **Sesame oil** (1 tsp)

### Tuesday: Bean & Cheese Quesadillas
- **Flour tortillas** (4 large)
- **Black beans** (1 can)
- **Shredded cheese** (1 cup)
- **Salsa** (for serving)

### Wednesday: Spaghetti Bolognese
- **Ground beef** (1 lb)
- **Spaghetti** (1 lb box)
- **Canned crushed tomatoes** (28 oz can)
- **Onion** (1 medium)
- **Garlic** (3 cloves)

### Thursday: Sheet Pan Sausage & Veggies
- **Smoked sausage** (1 package)
- **Bell peppers** (2)
- **Zucchini** (1 large)
- **Potatoes** (3 medium)
- **Olive oil** and seasoning

### Friday: Homemade Pizza Night
- **Pizza dough** (store-bought or homemade)
- **Mozzarella cheese** (2 cups)
- **Tomato sauce** (1/2 cup)
- **Your favorite toppings**

**Estimated total grocery cost: $45-55 for the week!**

Would you like me to compare prices for these ingredients at stores near you?`
  }

  if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable') || lower.includes('money')) {
    return `Great question! Here are my top **budget-friendly grocery tips**:

### Shop Smart
- **Buy store brands** — save 20-40% on identical products
- **Shop seasonal produce** — in-season items are up to 50% cheaper
- **Check clearance racks** for discounted items near sell-by dates
- **Buy whole chickens** instead of parts (often $1-2/lb cheaper)

### Plan Ahead
- **Make a weekly meal plan** and shopping list before you go
- **Check store flyers** on Wednesdays when new sales start
- **Cook in bulk** on weekends — freeze portions for busy nights

### Best Budget Staples
- **Rice** (~$0.15/serving)
- **Dried beans** (~$0.20/serving)
- **Eggs** (~$0.30/serving)
- **Oats** (~$0.15/serving)
- **Bananas** (~$0.25 each)
- **Frozen vegetables** (~$0.50/serving)

### Price Compare
- Use Julyu's **Compare** feature to check prices across multiple stores
- Track weekly specials and stock up when staples go on sale

A family of 4 can eat well for **$75-100/week** using these strategies!

Want me to create a specific budget meal plan for you?`
  }

  if (lower.includes('recipe') || lower.includes('cook') || lower.includes('dinner idea') || lower.includes('make')) {
    return `Here's a quick and delicious recipe for you:

## Honey Garlic Salmon with Roasted Vegetables

### Ingredients
- **Salmon fillets** (4 pieces, about 6oz each)
- **Honey** (3 tablespoons)
- **Soy sauce** (2 tablespoons)
- **Garlic** (4 cloves, minced)
- **Asparagus** (1 bunch, trimmed)
- **Cherry tomatoes** (1 pint)
- **Lemon** (1, sliced)
- **Olive oil** (2 tablespoons)
- **Salt and pepper** to taste

### Instructions
1. Preheat oven to 400°F and line a baking sheet with parchment paper
2. Mix honey, soy sauce, and garlic in a small bowl
3. Place salmon fillets in the center of the baking sheet
4. Arrange asparagus and tomatoes around the salmon
5. Drizzle vegetables with olive oil, salt, and pepper
6. Pour honey garlic sauce over the salmon
7. Top with lemon slices and bake 15-18 minutes

**Cost per serving:** ~$4.50

This is a complete one-pan meal — easy cleanup! Serve with rice to stretch it further.

Would you like me to find the best prices for these ingredients near you?`
  }

  if (lower.includes('save') || lower.includes('saving') || lower.includes('deal') || lower.includes('coupon') || lower.includes('discount')) {
    return `Here are some proven ways to **maximize your grocery savings**:

### Digital Coupons & Apps
- **Store apps** (Kroger, Target Circle, Walmart+) often have exclusive digital coupons
- **Ibotta** — earn cashback on groceries (avg $20-40/month)
- **Checkout 51** — additional cashback offers
- **Fetch Rewards** — scan any receipt for points

### Strategic Shopping
- **Shop on Wednesdays** when new weekly ads start and old deals overlap
- **Buy loss leaders** — stores discount popular items to get you in the door
- **Stock up during sales** on non-perishable items you use regularly
- **Compare unit prices** not just sticker prices

### Store-Specific Tips
- **ALDI** — Best for everyday staples, 30-50% cheaper than average
- **Costco/Sam's** — Great for bulk proteins, dairy, and household items
- **Walmart** — Price match guarantee makes it easy to get the best deal
- **Kroger** — Fuel points + digital coupons can save $50+/month

### Estimated Annual Savings
- Store brand switching: **$500-800/year**
- Cashback apps: **$300-500/year**
- Weekly sale shopping: **$600-1,000/year**

That's up to **$2,300/year** in potential savings!

Want me to help you compare prices on specific items?`
  }

  if (lower.includes('substitute') || lower.includes('replacement') || lower.includes('instead of') || lower.includes('alternative')) {
    return `Here are some great **ingredient substitutions** that can save money or work in a pinch:

### Common Substitutions
- **Butter** → Coconut oil, olive oil, or applesauce (in baking)
- **Heavy cream** → Full-fat coconut milk or evaporated milk
- **Sour cream** → Plain Greek yogurt (healthier too!)
- **Buttermilk** → 1 cup milk + 1 tbsp lemon juice (let sit 5 min)
- **Eggs** (in baking) → 1/4 cup applesauce or mashed banana per egg
- **Fresh herbs** → 1/3 the amount of dried herbs

### Budget Swaps
- **Pine nuts** → Sunflower seeds or walnuts (saves $8-10/lb)
- **Parmesan** → Pecorino Romano (similar flavor, often cheaper)
- **Vanilla extract** → Vanilla bean paste or imitation vanilla
- **Fresh berries** → Frozen berries (often half the price, great for smoothies)
- **Chicken breast** → Chicken thighs (more flavorful, $1-2/lb cheaper)

These substitutions can save you **$20-40/month** without sacrificing flavor!

Would you like recipe suggestions using any of these substitutions?`
  }

  // Default response
  return `That's a great question! Here are a few ways I can help you with your groceries:

### What I Can Do
- **Find the best prices** on specific items across stores near you
- **Create meal plans** tailored to your budget and preferences
- **Suggest recipes** based on ingredients you already have
- **Compare prices** at different stores for your shopping list
- **Set price alerts** so you never miss a deal

### Quick Tips
- Check out our **Compare** feature to see real-time price comparisons
- Ask me for a **weekly meal plan** to save time and money
- I can suggest **budget-friendly substitutes** for expensive ingredients

**Try asking me:**
- "What's the cheapest place to buy chicken near me?"
- "Give me a dinner recipe under $3 per serving"
- "Help me plan meals for the week"

What would you like help with?`
}

export default function DemoAssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentConvId, setCurrentConvId] = useState<string | null>('conv-1')
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [extractingIngredients, setExtractingIngredients] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadConversation = (convId: string) => {
    let msgs: Message[] = []
    if (convId === 'conv-1') {
      msgs = INITIAL_MESSAGES
    } else if (convId === 'conv-2') {
      msgs = CONV2_MESSAGES
    } else if (convId === 'conv-3') {
      msgs = CONV3_MESSAGES
    }
    setCurrentConvId(convId)
    setMessages(msgs)
    setShowHistory(false)
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentConvId(null)
    setShowHistory(false)
    inputRef.current?.focus()
  }

  const sendMessage = (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate a 1-2 second "thinking" delay then show pre-scripted response
    const delay = 1000 + Math.random() * 1000
    setTimeout(() => {
      const responseContent = getMockResponse(content)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, delay)
  }

  const handleCompareIngredients = (content: string) => {
    setExtractingIngredients(true)

    // Simulate extraction delay, then navigate to demo compare
    setTimeout(() => {
      // Extract some plausible ingredient names from the message for the compare page
      const ingredients: string[] = []
      const boldMatches = content.match(/\*\*([^*]+)\*\*/g)
      if (boldMatches) {
        const skipPhrases = ['cost per serving', 'cost:', 'quick tip', 'let me know', 'budget-friendly', 'estimated']
        for (const match of boldMatches) {
          const item = match.replace(/\*+/g, '').trim()
          const lower = item.toLowerCase()
          if (skipPhrases.some(p => lower.includes(p))) continue
          if (item.length > 30 || item.length < 2) continue
          if (/^\d+\./.test(item)) continue
          // Strip leading measurements
          const simplified = item
            .replace(/^\d+[\d\/\.\s-]*\s*(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|cans?|cloves?|pieces?|bunch|bunches|head|heads|bag|bags|package|packages|bottle|bottles|jar|jars|g|kg|ml|l)?\s*/i, '')
            .replace(/\([^)]*\)/g, '')
            .replace(/,.*$/, '')
            .trim()
          if (simplified.length > 2 && !ingredients.includes(simplified)) {
            ingredients.push(simplified)
          }
        }
      }

      if (ingredients.length > 0) {
        localStorage.setItem('compareItems', JSON.stringify(ingredients.slice(0, 15)))
      } else {
        // Fallback demo ingredients
        localStorage.setItem('compareItems', JSON.stringify(['chicken breast', 'rice', 'onion', 'garlic', 'broccoli']))
      }

      setExtractingIngredients(false)
      router.push('/demo/dashboard/compare?fromAssistant=true')
    }, 800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="h-[calc(100vh-128px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Jules</h1>
            <p className="text-sm text-gray-500">Your personal shopping buddy</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>

          {/* History Dropdown */}
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm flex items-center gap-2"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="p-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <p className="text-xs uppercase font-medium px-2" style={{ color: 'var(--text-muted)' }}>Recent Conversations</p>
                </div>
                {conversations.length > 0 ? (
                  <div className="p-2">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 truncate transition text-sm ${
                          currentConvId === conv.id
                            ? 'bg-green-500/15 text-green-500'
                            : 'hover:opacity-80'
                        }`}
                        style={{ color: currentConvId === conv.id ? undefined : 'var(--text-secondary)' }}
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No conversations yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm">
                I can help with meal planning, recipe suggestions, budget tips, and finding the best deals.
              </p>

              <div className="grid grid-cols-2 gap-2 max-w-md">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-3 py-2.5 rounded-lg hover:border-green-500 transition text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-green-500'
                          : ''
                      }`}
                      style={message.role === 'assistant' ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' } : undefined}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed text-gray-200">
                          {renderMarkdown(stripActionTags(message.content))}
                        </div>
                      ) : (
                        <div className="text-sm text-white font-medium">{message.content}</div>
                      )}
                      <div className={`text-xs mt-1.5 ${message.role === 'user' ? 'text-green-100/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {/* Compare Prices button for messages with ingredients */}
                    {message.role === 'assistant' && hasIngredients(message.content) && (
                      <button
                        onClick={() => handleCompareIngredients(message.content)}
                        disabled={extractingIngredients}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 text-green-400 rounded-lg hover:from-green-500/30 hover:to-green-600/30 hover:border-green-500/60 transition-all duration-300 text-sm font-medium shadow-lg shadow-green-500/10 hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {extractingIngredients ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        )}
                        {extractingIngredients ? 'Extracting Ingredients...' : 'Compare Ingredient Prices'}
                        {!extractingIngredients && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0 flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about groceries..."
                  rows={1}
                  className="w-full rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm"
                  style={{ minHeight: '48px', maxHeight: '120px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
