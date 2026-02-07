'use client'

import { useState } from 'react'

// Inline mock data for chat page
interface Friend {
  id: string
  name: string
  avatar: string
  lastMessage: string
  online: boolean
}

interface ChatMessage {
  id: string
  sender: string
  content: string
  time: string
  isMe: boolean
}

const FRIENDS: Friend[] = [
  { id: '1', name: 'Mike Thompson', avatar: 'MT', lastMessage: 'Found great deals at ALDI!', online: true },
  { id: '2', name: 'Jessica Lee', avatar: 'JL', lastMessage: 'Thanks for the list!', online: true },
  { id: '3', name: 'David Garcia', avatar: 'DG', lastMessage: 'See you at the farmers market', online: false },
]

const CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    { id: '1a', sender: 'Mike Thompson', content: 'Hey! Have you tried the new ALDI that opened on 5th street?', time: '10:32 AM', isMe: false },
    { id: '1b', sender: 'Me', content: 'Not yet! Is it any good?', time: '10:34 AM', isMe: true },
    { id: '1c', sender: 'Mike Thompson', content: 'Found great deals at ALDI! Chicken breast for $2.79/lb and eggs for $2.49 a dozen', time: '10:35 AM', isMe: false },
    { id: '1d', sender: 'Me', content: 'Wow that is amazing, way cheaper than Kroger. I need to check it out this weekend', time: '10:36 AM', isMe: true },
    { id: '1e', sender: 'Mike Thompson', content: 'Definitely worth it. Their store brand stuff is really good quality too. I saved like $15 on my last trip compared to my usual store', time: '10:38 AM', isMe: false },
    { id: '1f', sender: 'Me', content: 'Awesome, I just ran a comparison on Julyu and ALDI came out cheapest for my list too!', time: '10:40 AM', isMe: true },
  ],
  '2': [
    { id: '2a', sender: 'Jessica Lee', content: 'Hey Sarah! Can you share your healthy meal prep list?', time: 'Yesterday', isMe: false },
    { id: '2b', sender: 'Me', content: 'Of course! I just shared it with you in the app', time: 'Yesterday', isMe: true },
    { id: '2c', sender: 'Jessica Lee', content: 'Thanks for the list! This looks great. Where do you buy the quinoa?', time: 'Yesterday', isMe: false },
    { id: '2d', sender: 'Me', content: 'I get it at Kroger usually, but Walmart has it cheaper. Check the comparison tool!', time: 'Yesterday', isMe: true },
  ],
  '3': [
    { id: '3a', sender: 'David Garcia', content: 'The downtown farmers market has amazing deals on seasonal produce right now', time: '2 days ago', isMe: false },
    { id: '3b', sender: 'Me', content: 'Oh nice! What days is it open?', time: '2 days ago', isMe: true },
    { id: '3c', sender: 'David Garcia', content: 'Saturdays 8am-1pm. See you at the farmers market this weekend?', time: '2 days ago', isMe: false },
  ],
}

export default function DemoChatPage() {
  const [selectedFriend, setSelectedFriend] = useState<string>('1')
  const messages = CHAT_MESSAGES[selectedFriend] || []
  const currentFriend = FRIENDS.find(f => f.id === selectedFriend)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Chat</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Share deals and lists with friends
        </p>
      </div>

      {/* Chat Layout */}
      <div
        className="flex-1 rounded-xl overflow-hidden flex"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Friends List */}
        <div
          className="w-72 flex-shrink-0 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border-color)' }}
        >
          <div className="p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Friends
            </h3>
          </div>
          {FRIENDS.map(friend => (
            <div
              key={friend.id}
              onClick={() => setSelectedFriend(friend.id)}
              className="flex items-center gap-3 p-4 cursor-pointer transition"
              style={{
                backgroundColor: selectedFriend === friend.id ? 'rgba(34,197,94,0.1)' : 'transparent',
                borderLeft: selectedFriend === friend.id ? '3px solid #22c55e' : '3px solid transparent',
              }}
            >
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  {friend.avatar}
                </div>
                {friend.online && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{ backgroundColor: '#22c55e', borderColor: 'var(--bg-card)' }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {friend.name}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {friend.lastMessage}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              {currentFriend?.avatar}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {currentFriend?.name}
              </div>
              <div className="text-xs" style={{ color: currentFriend?.online ? '#22c55e' : 'var(--text-muted)' }}>
                {currentFriend?.online ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.isMe ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                    style={{
                      backgroundColor: msg.isMe ? '#22c55e' : 'var(--bg-primary)',
                      color: msg.isMe ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div
                    className={`text-xs mt-1 ${msg.isMe ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {msg.time}
                  </div>
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
                className="px-5 py-3 rounded-lg font-semibold text-white opacity-60 cursor-not-allowed"
                style={{ backgroundColor: '#22c55e' }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
