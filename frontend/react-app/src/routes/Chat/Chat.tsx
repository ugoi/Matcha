import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged'
import './chat.css'

interface MatchItem {
  id: string
  name: string
  image: string
  lastMessage?: string
  timestamp?: string
}

interface ChatMessage {
  chat_id: string
  sender_user_id: string
  receiver_user_id: string
  message: string
  sent_at: string
}

interface LikeUser {
  user_id: string
  first_name: string
  last_name: string
  profile_picture: string
}

interface FullProfile {
  profile_id: string
  user_id: string
  first_name: string
  last_name: string
  age: number
  biography: string
  profile_picture: string
  pictures?: { picture_url: string }[]
  interests?: { interest_tag: string }[]
  fame_rating?: number
  gender?: string
  sexual_preference?: string
  username?: string | null
  created_at?: string
  last_online?: string
}

export default function Chat() {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [chats, setChats] = useState<MatchItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [view, setView] = useState<'matches' | 'likes' | 'visited'>('matches')
  const [likes, setLikes] = useState<LikeUser[]>([])
  const [views, setViews] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [expandedProfile, setExpandedProfile] = useState<FullProfile | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const chatHistoryRef = useRef<HTMLDivElement | null>(null)
  const selectedUserIdRef = useRef<string | null>(null)
  const navigate = useNavigate()

  // Helper function to format "last online" in a human-friendly manner.
  const formatLastOnline = (lastOnlineStr?: string): string => {
    if (!lastOnlineStr) return 'Unknown'
    const lastOnline = new Date(lastOnlineStr)
    const diffMs = new Date().getTime() - lastOnline.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 1) return 'Just now'
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }

  useEffect(() => {
    (async () => {
      const res = await fetch(`${window.location.origin}/api/profiles/me`, { credentials: 'include' })
      const data = await res.json()
      if (data.status === 'success') {
        setUserId(data.data.user_id)
      } else {
        navigate('/profile')
      }
    })()
  }, [navigate])

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId
  }, [selectedUserId])

  useEffect(() => {
    if (!userId) return
    socketRef.current = io('ws://localhost:3000/api/chat', { withCredentials: true })
    socketRef.current.on('chat message', (data, ack) => {
      const newMsg: ChatMessage = {
        chat_id: Math.random().toString(36).substring(2),
        sender_user_id: data.sender,
        receiver_user_id: userId,
        message: data.msg,
        sent_at: data.timestamp || new Date().toISOString()
      }
      if (
        newMsg.sender_user_id === selectedUserIdRef.current ||
        newMsg.receiver_user_id === selectedUserIdRef.current
      ) {
        setMessageHistory(prev =>
          [...prev, newMsg].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
        )
      }
      setChats(prev =>
        prev.map(c =>
          c.id === data.sender
            ? { ...c, lastMessage: data.msg, timestamp: new Date(data.timestamp || Date.now()).toLocaleString() }
            : c
        )
      )
      if (typeof ack === 'function') ack('Message received')
    })
    socketRef.current.on('error', () => {})
    return () => {
      socketRef.current?.disconnect()
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    (async () => {
      const [matchedRes, likesRes, visitsRes] = await Promise.all([
        fetch('http://localhost:3000/api/profiles/matched', { credentials: 'include' }),
        fetch('http://localhost:3000/api/profiles/likes', { credentials: 'include' }),
        fetch('http://localhost:3000/api/profiles/visits', { credentials: 'include' })
      ])
      const matchedData = await matchedRes.json()
      const likesData = await likesRes.json()
      const visitsData = await visitsRes.json()
      if (matchedData.status === 'success' && Array.isArray(matchedData.data?.matches)) {
        const freshMatches: MatchItem[] = []
        const freshChats: MatchItem[] = []
        matchedData.data.matches.forEach((m: any) => {
          const p = m.matched?.find((x: any) => x.user_id !== userId)
          if (p?.user_id) {
            const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'
            const item = {
              id: p.user_id,
              name,
              image: p.profile_picture || 'https://via.placeholder.com/150',
              lastMessage: m.lastMessage,
              timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : undefined
            }
            if (m.lastMessage) freshChats.push(item)
            else freshMatches.push(item)
          }
        })
        setMatches(freshMatches)
        setChats(freshChats)
      }
      if (likesData.status === 'success' && Array.isArray(likesData.data?.likes)) {
        const arr = likesData.data.likes.map((like: any) => {
          const u = like.matcher?.[0]
          return u
            ? {
                user_id: u.user_id,
                first_name: u.first_name,
                last_name: u.last_name || '',
                profile_picture: u.profile_picture || 'https://via.placeholder.com/40'
              }
            : { user_id: like.liker_user_id, first_name: '', last_name: '', profile_picture: 'https://via.placeholder.com/40' }
        })
        setLikes(arr)
      }
      if (visitsData.status === 'success' && Array.isArray(visitsData.data?.visits)) {
        setViews(visitsData.data.visits)
      }
    })()
  }, [userId])

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messageHistory])

  const openChat = async (uid: string) => {
    setSelectedUserId(uid)
    setMessageHistory([])
    try {
      const res = await fetch(`http://localhost:3000/api/chats/${uid}?limit=20`, { credentials: 'include' })
      const j = await res.json()
      if (j.status === 'success' && Array.isArray(j.data?.chats)) {
        const sortedChats = j.data.chats.sort(
          (a: ChatMessage, b: ChatMessage) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        )
        setMessageHistory(sortedChats)
      }
    } catch {}
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return
    const msg = messageInput.trim()
    setMessageInput('')
    const tempMsg: ChatMessage = {
      chat_id: Math.random().toString(36).substring(2),
      sender_user_id: userId,
      receiver_user_id: selectedUserId,
      message: msg,
      sent_at: new Date().toISOString()
    }
    setMessageHistory(prev =>
      [...prev, tempMsg].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
    )
    try {
      const res = await fetch(`http://localhost:3000/api/chats/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'success') {
          if (Array.isArray(data.data?.chats)) {
            const sortedChats = data.data.chats.sort(
              (a: ChatMessage, b: ChatMessage) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            )
            setMessageHistory(sortedChats)
          } else if (data.data?.chat) {
            setMessageHistory(prev =>
              [...prev.filter(x => x.chat_id !== tempMsg.chat_id), data.data.chat].sort(
                (a: ChatMessage, b: ChatMessage) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              )
            )
          }
        }
      }
    } catch {}
    if (socketRef.current) {
      socketRef.current.emit('chat message', { msg, receiver: selectedUserId })
    }
    setChats(prev => {
      const existing = prev.find(c => c.id === selectedUserId)
      if (existing) {
        return prev.map(c =>
          c.id === selectedUserId
            ? { ...c, lastMessage: msg, timestamp: new Date().toLocaleString() }
            : c
        )
      }
      const maybeMatch = matches.find(m => m.id === selectedUserId)
      return maybeMatch
        ? [...prev, { ...maybeMatch, lastMessage: msg, timestamp: new Date().toLocaleString() }]
        : prev
    })
    setMatches(prev => prev.filter(x => x.id !== selectedUserId))
  }

  const fetchFullProfile = async (likeUserId: string) => {
    const res = await fetch(`http://localhost:3000/api/profiles/${likeUserId}`, { credentials: 'include' })
    const data = await res.json()
    return data.status === 'success' && data.data ? (data.data as FullProfile) : null
  }

  const handleExpandLike = async (like: LikeUser) => {
    const profileData = await fetchFullProfile(like.user_id)
    if (profileData) setExpandedProfile(profileData)
  }

  // New function to report a fake account.
  const handleReportFake = async () => {
    if (!expandedProfile) return
    try {
      const params = new URLSearchParams({ reason: 'scammer asked for money' })
      const res = await fetch(`http://localhost:3000/api/profiles/${expandedProfile.profile_id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: params.toString()
      })
      if (res.ok) {
        alert('Report submitted successfully.')
        setExpandedProfile(null)
      } else {
        const err = await res.json()
        alert(`Error reporting: ${err.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error reporting account.')
    }
  }

  const renderExpandedProfile = () =>
    expandedProfile && (
      <div className="d-flex justify-content-center mt-3">
        <div className="card text-center p-3 shadow-lg" style={{ width: '22rem' }}>
          <img
            src={expandedProfile.profile_picture || 'https://via.placeholder.com/200'}
            alt={`${expandedProfile.first_name} ${expandedProfile.last_name}`}
            className="card-img-top"
          />
          <div className="card-body">
            <h4 className="card-title mb-2">
              {expandedProfile.first_name} {expandedProfile.last_name}, {expandedProfile.age}
            </h4>
            <p className="card-text text-muted mb-3">{expandedProfile.biography}</p>
            {expandedProfile.interests && expandedProfile.interests.length > 0 && (
              <p className="card-text mb-3">
                <strong>Interests:</strong> {expandedProfile.interests.map(i => i.interest_tag).join(', ')}
              </p>
            )}
            <p className="card-text text-muted mb-1">Fame Rating: {expandedProfile.fame_rating}</p>
            {expandedProfile.last_online && (
              <p className="card-text text-muted mb-1">
                Last online: {formatLastOnline(expandedProfile.last_online)}
              </p>
            )}
            <div className="d-flex justify-content-around mt-3">
              <button className="btn btn-secondary" onClick={() => setExpandedProfile(null)}>
                Close
              </button>
              <button className="btn btn-danger" onClick={handleReportFake}>
                Report
              </button>
            </div>
          </div>
        </div>
      </div>
    )

  const renderMatches = () => (
    <div className="matches-list d-flex overflow-auto mb-3">
      {matches.length ? (
        matches.map(m => (
          <div
            key={m.id}
            className="match-avatar-container mx-2"
            onClick={() => openChat(m.id)}
            style={{ cursor: 'pointer' }}
          >
            <img src={m.image} alt={m.name} className="match-avatar rounded-circle" />
            <p className="match-name text-center mt-2">{m.name}</p>
          </div>
        ))
      ) : (
        <div>No new matches</div>
      )}
    </div>
  )

  const renderChats = () => (
    <div className="chats-list">
      {chats.length ? (
        chats.map(chat => (
          <div
            key={chat.id}
            className="chat-item p-3 shadow-sm d-flex align-items-center"
            onClick={() => openChat(chat.id)}
            style={{ cursor: 'pointer' }}
          >
            <img src={chat.image} alt={chat.name} className="chat-avatar rounded-circle" />
            <div className="chat-info ms-3">
              <h5>{chat.name}</h5>
              <p className="text-muted mb-0">{chat.lastMessage || 'No messages yet'}</p>
            </div>
            <span className="ms-auto text-muted">{chat.timestamp || ''}</span>
          </div>
        ))
      ) : (
        <div>No chats yet</div>
      )}
    </div>
  )

  const handleUnmatch = async () => {
    if (!selectedUserId) return
    await fetch(`http://localhost:3000/api/profiles/${selectedUserId}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    setChats(prev => prev.filter(chat => chat.id !== selectedUserId))
    setMatches(prev => prev.filter(match => match.id !== selectedUserId))
    setSelectedUserId(null)
    setMessageHistory([])
  }

  const handleBlock = async () => {
    if (!selectedUserId) return
    await fetch(`http://localhost:3000/api/profiles/${selectedUserId}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    setChats(prev => prev.filter(chat => chat.id !== selectedUserId))
    setMatches(prev => prev.filter(match => match.id !== selectedUserId))
    setSelectedUserId(null)
    setMessageHistory([])
  }

  const renderChatWindow = () => {
    if (!selectedUserId) return null
    const foundChat = chats.find(c => c.id === selectedUserId)
    return (
      <div className="chat-window mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5>{foundChat?.name || 'Chat'}</h5>
          <div>
            <button className="btn btn-danger btn-sm me-2" onClick={handleUnmatch}>
              Unmatch
            </button>
            <button className="btn btn-warning btn-sm" onClick={handleBlock}>
              Block
            </button>
          </div>
        </div>
        <div className="chat-history" ref={chatHistoryRef}>
          {messageHistory.map(msg => (
            <div
              key={msg.chat_id}
              className={`message-bubble ${msg.sender_user_id === userId ? 'message-sent' : 'message-received'}`}
            >
              <p>{msg.message}</p>
              <small className="text-muted">{new Date(msg.sent_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            className="form-control"
            rows={2}
            placeholder="Type your message..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button className="btn btn-success" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    )
  }

  const renderLikesViews = () => {
    if (expandedProfile) return renderExpandedProfile()
    return (
      <div className="likes-views-section d-flex justify-content-around mt-3">
        <div className="likes-container w-50 px-3">
          <h4>Likes</h4>
          <ul className="list-group">
            {likes.length ? (
              likes.map(like => (
                <li
                  key={like.user_id}
                  className="list-group-item d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleExpandLike(like)}
                >
                  <img
                    src={like.profile_picture}
                    alt={`${like.first_name} ${like.last_name}`.trim() || 'Unknown'}
                    className="me-3 rounded-circle"
                    width="40"
                    height="40"
                  />
                  <span>{`${like.first_name} ${like.last_name}`.trim() || 'Unknown'}</span>
                </li>
              ))
            ) : (
              <div>No likes yet</div>
            )}
          </ul>
        </div>
        <div className="views-container w-50 px-3">
          <h4>Views</h4>
          <ul className="list-group">
            {views.length ? (
              views.map((v, i) => (
                <li key={i} className="list-group-item">
                  {v.name || 'Unknown User'}
                </li>
              ))
            ) : (
              <div>No views yet</div>
            )}
          </ul>
        </div>
      </div>
    )
  }

  const renderVisitedProfiles = () => (
    <div className="visited-profiles-section mt-3">
      <h4>Visited Profiles</h4>
      <div className="visited-profiles d-flex flex-wrap justify-content-center">
        {views.length ? (
          views.map((v: any, i: number) => (
            <div key={i} className="visited-profile-card m-2 text-center">
              <img
                src={v.profile_picture || 'https://via.placeholder.com/40'}
                alt={v.name || 'Unknown User'}
                className="rounded-circle"
                width="60"
                height="60"
              />
              <p className="mt-2">{v.name || 'Unknown User'}</p>
            </div>
          ))
        ) : (
          <p>No visits yet</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-3 shadow-lg chat-card">
          <div className="toggle-buttons d-flex justify-content-center mb-3">
            <button
              className={`btn ${view === 'matches' ? 'btn-primary' : 'btn-outline-primary'} mx-2`}
              onClick={() => setView('matches')}
            >
              Matches & Chats
            </button>
            <button
              className={`btn ${view === 'likes' ? 'btn-primary' : 'btn-outline-primary'} mx-2`}
              onClick={() => setView('likes')}
            >
              Likes & Views
            </button>
            <button
              className={`btn ${view === 'visited' ? 'btn-primary' : 'btn-outline-primary'} mx-2`}
              onClick={() => setView('visited')}
            >
              Visited Profiles
            </button>
          </div>
          {view === 'matches' ? (
            <>
              {renderMatches()}
              {renderChats()}
              {renderChatWindow()}
            </>
          ) : view === 'likes' ? (
            renderLikesViews()
          ) : (
            renderVisitedProfiles()
          )}
        </div>
      </div>
    </>
  )
}
