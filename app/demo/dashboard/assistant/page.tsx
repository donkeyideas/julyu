'use client'

// Inline mock data for Jules AI assistant page
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: "What's the cheapest place to buy milk near me?",
  },
  {
    id: '2',
    role: 'assistant',
    content: `Great question! Based on your zip code (45202), here are the best milk prices right now:

**1. ALDI** - $2.89/gallon (2% Reduced Fat)
**2. Walmart** - $3.18/gallon (Great Value 2%)
**3. Kroger** - $3.49/gallon (Kroger Brand 2%)
**4. Target** - $3.69/gallon (Good & Gather 2%)

ALDI has the best price by far -- $0.80 cheaper than the average! They also have organic milk at $4.49 if you prefer that. Want me to add milk to your shopping list?`,
  },
  {
    id: '3',
    role: 'user',
    content: 'Any deals on chicken this week?',
  },
  {
    id: '4',
    role: 'assistant',
    content: `Yes! There are some great chicken deals this week in your area:

**Kroger** - Buy One Get One Free on boneless chicken breast ($3.99/lb, effectively $2.00/lb). This is the best deal this week!

**ALDI** - Boneless chicken breast at $2.79/lb (everyday low price)

**Walmart** - Great Value chicken breast at $3.12/lb

**Tip:** The Kroger BOGO deal ends Sunday, so I'd recommend stocking up. You could buy 4 lbs and freeze the extra -- that would save you about $8 compared to your usual purchase at Publix ($4.99/lb).

Want me to set a price alert for chicken breast so you never miss deals like this?`,
  },
  {
    id: '5',
    role: 'user',
    content: 'Yes, set an alert for chicken under $3/lb',
  },
  {
    id: '6',
    role: 'assistant',
    content: `Done! I've created a price alert:

**Chicken Breast** - Alert when price drops below **$3.00/lb**
Monitoring at: Kroger, ALDI, Walmart, Target, Publix

I'll notify you as soon as any store in your area has chicken breast at or below $3.00/lb. Based on historical prices, this happens about 2-3 times per month, usually on Wednesdays when new weekly ads drop.

Is there anything else you'd like me to help with?`,
  },
]

export default function DemoAssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Jules - Your Grocery AI Assistant
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ask me anything about grocery prices, deals, and savings
        </p>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 rounded-xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome */}
          <div className="text-center py-4">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
            >
              <span className="text-2xl" style={{ color: '#22c55e' }}>J</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Hi! I&apos;m Jules, your grocery AI assistant. Ask me about prices, deals, or savings tips.
            </p>
          </div>

          {MESSAGES.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={{
                  backgroundColor: msg.role === 'user'
                    ? '#22c55e'
                    : 'var(--bg-primary)',
                  color: msg.role === 'user'
                    ? 'white'
                    : 'var(--text-primary)',
                }}
              >
                {msg.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {msg.content.split('\n').map((line, i) => {
                      // Simple markdown-like bold parsing
                      const parts = line.split(/(\*\*[^*]+\*\*)/)
                      return (
                        <div key={i} className={line === '' ? 'h-2' : ''}>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <span key={j} className="font-bold">
                                  {part.slice(2, -2)}
                                </span>
                              )
                            }
                            return <span key={j}>{part}</span>
                          })}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex gap-3">
            <input
              type="text"
              disabled
              placeholder="Demo mode - messages are pre-scripted"
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none opacity-60 cursor-not-allowed"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              disabled
              className="px-6 py-3 rounded-lg font-semibold text-white opacity-60 cursor-not-allowed"
              style={{ backgroundColor: '#22c55e' }}
            >
              Send
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
            This is a demo preview. Sign up to chat with Jules in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}
