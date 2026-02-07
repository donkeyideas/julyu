'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string | null
}

interface ChatMessage {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
  extracted_items?: string[]
  translatedContent?: string
  isTranslating?: boolean
}

interface ChatConversation {
  id: string
  participant_ids: string[]
  participants: User[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  friend: User
  created_at: string
}

interface FriendRequest {
  id: string
  sender_id: string
  recipient_id: string
  status: string
  created_at: string
  sender: User
}

// --- MOCK DATA ---

const DEMO_USER: User = {
  id: 'demo-user-1',
  email: 'sarah.johnson@email.com',
  full_name: 'Sarah Johnson',
}

const MOCK_USERS: Record<string, User> = {
  'demo-user-2': { id: 'demo-user-2', email: 'maria.garcia@email.com', full_name: 'Maria Garcia' },
  'demo-user-3': { id: 'demo-user-3', email: 'james.wilson@email.com', full_name: 'James Wilson' },
  'demo-user-4': { id: 'demo-user-4', email: 'alex.chen@email.com', full_name: 'Alex Chen' },
  'demo-user-5': { id: 'demo-user-5', email: 'tommy.lee@email.com', full_name: 'Tommy Lee' },
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    participant_ids: ['demo-user-1', 'demo-user-2'],
    participants: [DEMO_USER, MOCK_USERS['demo-user-2']],
    last_message: 'I\'ll send you my grocery list!',
    last_message_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread_count: 2,
  },
  {
    id: 'conv-2',
    participant_ids: ['demo-user-1', 'demo-user-3'],
    participants: [DEMO_USER, MOCK_USERS['demo-user-3']],
    last_message: 'Thanks for the recipe!',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread_count: 0,
  },
  {
    id: 'conv-3',
    participant_ids: ['demo-user-1', 'demo-user-4'],
    participants: [DEMO_USER, MOCK_USERS['demo-user-4']],
    last_message: 'The sale ends Sunday',
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread_count: 1,
  },
]

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1-1', sender_id: 'demo-user-2', content: 'Hey Sarah! Are you going grocery shopping this weekend?',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), sender: MOCK_USERS['demo-user-2'],
    },
    {
      id: 'msg-1-2', sender_id: 'demo-user-1', content: 'Yes! I need to stock up on a few things. Do you want to share a list?',
      created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-1-3', sender_id: 'demo-user-2', content: 'Definitely! I need chicken breast, rice, broccoli, olive oil, and garlic.',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), sender: MOCK_USERS['demo-user-2'],
    },
    {
      id: 'msg-1-4', sender_id: 'demo-user-1', content: 'Great, I also need eggs, milk, bread, and some avocados. We should compare prices first!',
      created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-1-5', sender_id: 'demo-user-2', content: 'Good idea! I heard Kroger has a sale on chicken this week. Also need tomatoes and onions.',
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), sender: MOCK_USERS['demo-user-2'],
    },
    {
      id: 'msg-1-6', sender_id: 'demo-user-1', content: 'I\'ll check the compare tool. We might save a lot buying together!',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-1-7', sender_id: 'demo-user-2', content: 'Perfect! I\'ll send you my grocery list!',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), sender: MOCK_USERS['demo-user-2'],
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1', sender_id: 'demo-user-3', content: 'Hey! I found an amazing pasta recipe I wanted to share with you.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), sender: MOCK_USERS['demo-user-3'],
    },
    {
      id: 'msg-2-2', sender_id: 'demo-user-1', content: 'Oh nice! What do you need for it?',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.9).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-2-3', sender_id: 'demo-user-3', content: 'You\'ll need spaghetti, ground beef, crushed tomatoes, basil, parmesan cheese, and garlic.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString(), sender: MOCK_USERS['demo-user-3'],
    },
    {
      id: 'msg-2-4', sender_id: 'demo-user-1', content: 'That sounds delicious! I think I have basil and garlic already. Need to get the rest.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.7).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-2-5', sender_id: 'demo-user-3', content: 'Also grab some red pepper flakes and a baguette for garlic bread. Trust me, it makes a huge difference!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), sender: MOCK_USERS['demo-user-3'],
    },
    {
      id: 'msg-2-6', sender_id: 'demo-user-1', content: 'Good call! I\'ll add those to my list. What about mozzarella?',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.3).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-2-7', sender_id: 'demo-user-3', content: 'Yes! Fresh mozzarella if you can find it. It melts so much better.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.2).toISOString(), sender: MOCK_USERS['demo-user-3'],
    },
    {
      id: 'msg-2-8', sender_id: 'demo-user-1', content: 'Thanks for the recipe!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), sender: DEMO_USER,
    },
  ],
  'conv-3': [
    {
      id: 'msg-3-1', sender_id: 'demo-user-4', content: 'Have you seen the deals at Walmart this week?',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), sender: MOCK_USERS['demo-user-4'],
    },
    {
      id: 'msg-3-2', sender_id: 'demo-user-1', content: 'No, what are they offering?',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24.5).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-3-3', sender_id: 'demo-user-4', content: 'Buy one get one free on cereal, 30% off fresh salmon, and bananas are only $0.22/lb!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24.3).toISOString(), sender: MOCK_USERS['demo-user-4'],
    },
    {
      id: 'msg-3-4', sender_id: 'demo-user-1', content: 'Wow, the salmon deal is amazing. I need to grab some before it runs out!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24.2).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-3-5', sender_id: 'demo-user-4', content: 'Also Target has almond milk for $2.49 and whole wheat bread for $1.99. Great prices!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24.1).toISOString(), sender: MOCK_USERS['demo-user-4'],
    },
    {
      id: 'msg-3-6', sender_id: 'demo-user-1', content: 'I should use the compare tool to see which store is cheapest overall.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24.05).toISOString(), sender: DEMO_USER,
    },
    {
      id: 'msg-3-7', sender_id: 'demo-user-4', content: 'The sale ends Sunday so don\'t wait too long!',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), sender: MOCK_USERS['demo-user-4'],
    },
  ],
}

const INITIAL_FRIENDS: Friend[] = [
  {
    id: 'friend-1', user_id: 'demo-user-1', friend_id: 'demo-user-2', status: 'accepted',
    friend: MOCK_USERS['demo-user-2'], created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'friend-2', user_id: 'demo-user-1', friend_id: 'demo-user-3', status: 'accepted',
    friend: MOCK_USERS['demo-user-3'], created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'friend-3', user_id: 'demo-user-1', friend_id: 'demo-user-4', status: 'accepted',
    friend: MOCK_USERS['demo-user-4'], created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1', sender_id: 'demo-user-5', recipient_id: 'demo-user-1', status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    sender: MOCK_USERS['demo-user-5'],
  },
]

const MOCK_TRANSLATIONS: Record<string, string> = {
  'msg-1-1': 'Hola Sarah! Vas a ir de compras este fin de semana?',
  'msg-1-3': 'Definitivamente! Necesito pechuga de pollo, arroz, brocoli, aceite de oliva y ajo.',
  'msg-1-5': 'Buena idea! Escuche que Kroger tiene una oferta en pollo esta semana. Tambien necesito tomates y cebollas.',
  'msg-1-7': 'Perfecto! Te envio mi lista de compras!',
  'msg-2-1': 'Hola! Encontre una receta de pasta increible que queria compartir contigo.',
  'msg-2-3': 'Necesitaras espagueti, carne molida, tomates triturados, albahaca, queso parmesano y ajo.',
  'msg-2-5': 'Tambien compra hojuelas de pimiento rojo y una baguette para pan de ajo. Creeme, hace una gran diferencia!',
  'msg-2-7': 'Si! Mozzarella fresca si puedes encontrarla. Se derrite mucho mejor.',
  'msg-3-1': 'Has visto las ofertas en Walmart esta semana?',
  'msg-3-3': 'Compra uno y lleva otro gratis en cereal, 30% de descuento en salmon fresco, y los platanos estan a solo $0.22/lb!',
  'msg-3-5': 'Tambien Target tiene leche de almendras a $2.49 y pan integral a $1.99. Excelentes precios!',
  'msg-3-7': 'La oferta termina el domingo, asi que no esperes mucho!',
}

const MOCK_AUTO_REPLIES: Record<string, string[]> = {
  'conv-1': [
    'That sounds great! Let me know what you find.',
    'I just checked and Kroger has the best deal on chicken right now!',
    'Should we go together on Saturday morning?',
  ],
  'conv-2': [
    'I also found a great dessert recipe if you want it!',
    'The trick is to use San Marzano tomatoes for the sauce.',
    'Let me know how it turns out!',
  ],
  'conv-3': [
    'I just stocked up on the salmon - it was totally worth it!',
    'There are even more deals in the app this weekend.',
    'ALDI also has some amazing produce deals right now.',
  ],
}

const EXTRACTED_ITEMS_MAP: Record<string, string[]> = {
  'conv-1': ['Chicken Breast', 'Rice', 'Broccoli', 'Olive Oil', 'Garlic', 'Eggs', 'Milk', 'Bread', 'Avocados', 'Tomatoes', 'Onions'],
  'conv-2': ['Spaghetti', 'Ground Beef', 'Crushed Tomatoes', 'Basil', 'Parmesan Cheese', 'Garlic', 'Red Pepper Flakes', 'Baguette', 'Mozzarella'],
  'conv-3': ['Cereal', 'Salmon', 'Bananas', 'Almond Milk', 'Whole Wheat Bread'],
}

// --- COMPONENT ---

export default function DemoChatPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [currentUser] = useState<User>(DEMO_USER)
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS)
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS)
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS)
  const [showFriends, setShowFriends] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [addFriendError, setAddFriendError] = useState('')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)
  const [extractedItems, setExtractedItems] = useState<string[]>([])
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [userLanguage, setUserLanguage] = useState('en')
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES)
  const autoReplyIndexRef = useRef<Record<string, number>>({})

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const translateMessage = (messageId: string, _content: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isTranslating: true } : m
    ))

    setTimeout(() => {
      const translated = MOCK_TRANSLATIONS[messageId]
      if (translated) {
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, translatedContent: translated, isTranslating: false }
            : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, isTranslating: false } : m
        ))
      }
    }, 800)
  }

  const handleFriendRequest = (requestId: string, action: 'accept' | 'decline') => {
    setProcessingRequest(requestId)

    setTimeout(() => {
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))

      if (action === 'accept') {
        const request = friendRequests.find(r => r.id === requestId)
        if (request) {
          const newFriend: Friend = {
            id: `friend-${Date.now()}`,
            user_id: DEMO_USER.id,
            friend_id: request.sender_id,
            status: 'accepted',
            friend: request.sender,
            created_at: new Date().toISOString(),
          }
          setFriends(prev => [...prev, newFriend])
        }
      }

      setProcessingRequest(null)
    }, 500)
  }

  const loadConversation = (conversation: ChatConversation) => {
    setActiveConversation(conversation)
    setTypingUsers([])
    const convMessages = allMessages[conversation.id] || []
    setMessages(convMessages)

    // Clear unread count
    setConversations(prev => prev.map(c =>
      c.id === conversation.id ? { ...c, unread_count: 0 } : c
    ))
  }

  const startNewConversation = (friend: Friend) => {
    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.participant_ids.includes(friend.friend_id)
    )
    if (existing) {
      loadConversation(existing)
    } else {
      const newConv: ChatConversation = {
        id: `conv-new-${Date.now()}`,
        participant_ids: [DEMO_USER.id, friend.friend_id],
        participants: [DEMO_USER, friend.friend],
        last_message: undefined,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      }
      setConversations(prev => [newConv, ...prev])
      setAllMessages(prev => ({ ...prev, [newConv.id]: [] }))
      setActiveConversation(newConv)
      setMessages([])
    }
    setShowFriends(false)
  }

  const sendMessage = () => {
    if (!input.trim() || !activeConversation || sending) return

    const messageContent = input.trim()
    setInput('')
    setSending(true)

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      sender: currentUser,
    }

    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setAllMessages(prev => ({ ...prev, [activeConversation.id]: updatedMessages }))

    // Update conversation last message
    setConversations(prev => prev.map(c =>
      c.id === activeConversation.id
        ? { ...c, last_message: messageContent, last_message_at: new Date().toISOString() }
        : c
    ))

    setSending(false)

    // Show typing indicator after a short delay, then auto-reply
    const convId = activeConversation.id
    const otherUser = getOtherParticipant(activeConversation)

    setTimeout(() => {
      setTypingUsers(otherUser ? [otherUser.full_name || otherUser.email] : ['Someone'])

      setTimeout(() => {
        setTypingUsers([])

        const replies = MOCK_AUTO_REPLIES[convId] || ['Thanks for the message!', 'Sounds good!', 'Got it!']
        const idx = autoReplyIndexRef.current[convId] || 0
        const replyContent = replies[idx % replies.length]
        autoReplyIndexRef.current[convId] = idx + 1

        const replyMessage: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          sender_id: otherUser?.id || 'unknown',
          content: replyContent,
          created_at: new Date().toISOString(),
          sender: otherUser || undefined,
        }

        setMessages(prev => [...prev, replyMessage])
        setAllMessages(prev => ({
          ...prev,
          [convId]: [...(prev[convId] || []), replyMessage],
        }))
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? { ...c, last_message: replyContent, last_message_at: new Date().toISOString() }
            : c
        ))
      }, 1500)
    }, 800)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addFriend = () => {
    if (!friendEmail.trim()) return
    setAddFriendError('')

    // Simulate success
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      user_id: DEMO_USER.id,
      friend_id: `new-user-${Date.now()}`,
      status: 'pending',
      friend: {
        id: `new-user-${Date.now()}`,
        email: friendEmail.trim(),
        full_name: friendEmail.trim().split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      },
      created_at: new Date().toISOString(),
    }

    setFriends(prev => [...prev, newFriend])
    setFriendEmail('')
    setShowAddFriend(false)
  }

  const extractItemsFromChat = () => {
    if (!activeConversation) return

    setIsExtracting(true)
    setShowExtractModal(true)

    setTimeout(() => {
      const items = EXTRACTED_ITEMS_MAP[activeConversation.id] || []
      setExtractedItems(items)
      setIsExtracting(false)
    }, 1200)
  }

  const compareExtractedItems = () => {
    if (extractedItems.length === 0) return
    localStorage.setItem('compareItems', JSON.stringify(extractedItems))
    router.push('/demo/dashboard/compare?fromAssistant=true')
  }

  const getOtherParticipant = (conversation: ChatConversation) => {
    return conversation.participants?.find(p => p.id !== currentUser?.id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)

    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-muted)' }}>Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 pb-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Chat</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Share recipes and shopping tips with friends</p>
        </div>
        <div className="flex gap-2">
          {/* Language Selector */}
          <select
            value={userLanguage}
            onChange={(e) => setUserLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <option value="en">English</option>
            <option value="es">Espanol</option>
            <option value="fr">Francais</option>
            <option value="de">Deutsch</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
          </select>
          {userLanguage !== 'en' && (
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition ${autoTranslate ? 'bg-green-500 text-black font-semibold' : ''}`}
              style={!autoTranslate ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Auto-Translate
            </button>
          )}
          <button
            onClick={() => setShowFriends(true)}
            className="px-4 py-2 rounded-lg hover:opacity-80 transition text-sm flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Friends
            {friendRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                {friendRequests.length}
              </span>
            )}
          </button>
          {activeConversation && messages.length > 0 && (
            <button
              onClick={extractItemsFromChat}
              disabled={isExtracting}
              className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtracting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              {isExtracting ? 'Extracting...' : 'Extract Items'}
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-72 rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map(conv => {
                const other = getOtherParticipant(conv)
                const isActive = activeConversation?.id === conv.id
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full p-4 text-left transition ${isActive ? 'bg-green-500/15' : 'hover:opacity-80'}`}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                        {(other?.full_name || other?.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isActive ? 'text-green-500' : ''}`} style={{ color: isActive ? undefined : 'var(--text-primary)' }}>
                          {other?.full_name || other?.email || 'Unknown'}
                        </div>
                        {conv.last_message && (
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {conv.last_message}
                          </div>
                        )}
                      </div>
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm mb-4">No conversations yet</p>
                <button
                  onClick={() => setShowFriends(true)}
                  className="text-green-500 hover:text-green-400 text-sm font-medium"
                >
                  Start a chat with a friend
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                  {(getOtherParticipant(activeConversation)?.full_name || getOtherParticipant(activeConversation)?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getOtherParticipant(activeConversation)?.full_name || getOtherParticipant(activeConversation)?.email}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {getOtherParticipant(activeConversation)?.email}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => {
                    const isMine = message.sender_id === currentUser?.id
                    const showTranslateOption = !isMine && autoTranslate && userLanguage !== 'en'
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${isMine ? 'bg-green-500' : ''}`}
                            style={!isMine ? { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' } : undefined}
                          >
                            <div className={`text-sm ${isMine ? 'text-white' : ''}`} style={!isMine ? { color: 'var(--text-primary)' } : undefined}>
                              {message.translatedContent || message.content}
                            </div>
                            {message.translatedContent && (
                              <div className="text-xs mt-2 pt-2 italic" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                Original: {message.content}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 text-xs mt-1 ${isMine ? 'justify-end' : 'justify-start'}`} style={{ color: 'var(--text-muted)' }}>
                            {formatTime(message.created_at)}
                            {showTranslateOption && !message.translatedContent && !message.isTranslating && (
                              <button
                                onClick={() => translateMessage(message.id, message.content)}
                                className="text-green-500 hover:text-green-400 transition"
                                title="Translate to your language"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                              </button>
                            )}
                            {message.isTranslating && (
                              <span className="text-green-500">Translating...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%]">
                        <div
                          className="px-4 py-3 rounded-2xl"
                          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 rounded-xl px-4 py-3 resize-none focus:border-green-500 focus:outline-none text-sm"
                    style={{ minHeight: '48px', maxHeight: '120px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="p-3 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Start Chatting</h3>
                <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                  Select a conversation or start a new one with a friend
                </p>
                <button
                  onClick={() => setShowFriends(true)}
                  className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Friends Modal */}
      {showFriends && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Friends</h3>
              <button
                onClick={() => setShowFriends(false)}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Add Friend Section */}
              {showAddFriend ? (
                <div className="mb-6">
                  <input
                    type="email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    placeholder="Enter friend's email..."
                    className="w-full rounded-lg px-4 py-3 mb-2 focus:border-green-500 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  {addFriendError && (
                    <p className="text-red-500 text-sm mb-2">{addFriendError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddFriend(false); setFriendEmail(''); setAddFriendError('') }}
                      className="flex-1 px-4 py-2 rounded-lg hover:opacity-80 transition"
                      style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addFriend}
                      className="flex-1 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full px-4 py-3 mb-6 rounded-lg transition flex items-center justify-center gap-2"
                  style={{ border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Friend
                </button>
              )}

              {/* Incoming Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-semibold uppercase mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Incoming Requests ({friendRequests.length})
                  </div>
                  <div className="space-y-2">
                    {friendRequests.map(request => (
                      <div
                        key={request.id}
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {(request.sender.full_name || request.sender.email)[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {request.sender.full_name || request.sender.email.split('@')[0]}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{request.sender.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFriendRequest(request.id, 'accept')}
                            disabled={processingRequest === request.id}
                            className="flex-1 px-3 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50"
                          >
                            {processingRequest === request.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(request.id, 'decline')}
                            disabled={processingRequest === request.id}
                            className="flex-1 px-3 py-2 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition text-sm disabled:opacity-50"
                            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.filter(f => f.status === 'accepted').map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => startNewConversation(friend)}
                      className="w-full p-3 rounded-lg transition flex items-center gap-3 hover:opacity-80"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                        {(friend.friend.full_name || friend.friend.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {friend.friend.full_name || friend.friend.email}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{friend.friend.email}</div>
                      </div>
                      <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  ))}

                  {/* Sent Requests - Awaiting response */}
                  {friends.filter(f => f.status === 'pending').length > 0 && (
                    <>
                      <div className="pt-4 text-xs font-semibold uppercase flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Sent Requests
                      </div>
                      {friends.filter(f => f.status === 'pending').map(friend => (
                        <div
                          key={friend.id}
                          className="w-full p-3 rounded-lg flex items-center gap-3"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                            {(friend.friend.full_name || friend.friend.email)[0].toUpperCase()}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {friend.friend.full_name || friend.friend.email}
                            </div>
                            <div className="text-xs text-yellow-500">Waiting for them to accept...</div>
                          </div>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : friendRequests.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No friends yet</p>
                  <p className="text-xs mt-1">Send friend requests by email to start chatting!</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Extract Items Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Extracted Items</h3>
              <button
                onClick={() => setShowExtractModal(false)}
                className="hover:opacity-70 transition"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {isExtracting ? (
                <div className="text-center py-8">
                  <svg className="w-8 h-8 animate-spin mx-auto mb-3 text-green-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analyzing conversation for ingredients...</p>
                </div>
              ) : extractedItems.length > 0 ? (
                <>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Found {extractedItems.length} items from your conversation
                  </p>
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {extractedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <span className="text-green-500 font-semibold">1x</span>
                        <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                        <button
                          onClick={() => setExtractedItems(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-auto hover:text-red-500 transition"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={compareExtractedItems}
                    className="w-full px-4 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Compare Prices
                  </button>
                </>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No food items found in the conversation</p>
                  <p className="text-xs mt-1">Try sharing recipes or ingredient lists in the chat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
