// src/routes/Chat/Chat.tsx

import { useEffect, useState, useRef } from 'react';
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './chat.css';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface MatchItem {
  id: string;
  name: string;
  image: string;
  lastMessage?: string;
  timestamp?: string;
}

interface ChatMessage {
  message_id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  created_at: string;
}

interface LikeUser {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
}

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

function Chat() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [chats, setChats] = useState<MatchItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [view, setView] = useState<'matches' | 'likes'>('matches');
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  // Fetch user profile to get userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.status === 'success') {
          const fetchedUserId = result.data.user_id;
          setUserId(fetchedUserId);
        } else {
          window.location.href = '/create-profile';
        }
      } catch (error) {
        window.location.href = '/create-profile';
      }
    };
    fetchUserProfile();
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (userId) {
      const token = getCookie('jwt');
      console.log('Document cookies:', document.cookie);
      console.log('Retrieved JWT token:', token);

      if (!token) {
        console.error('JWT token not found. Ensure the "jwt" cookie is accessible and not HttpOnly.');
        return;
      }

      socketRef.current = io('http://localhost:3000/api/chat', {
        withCredentials: true,
        auth: {
          token: `Bearer ${token}`,
        },
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      socketRef.current.on('chat message', (data: ChatMessage, ack: (response: string) => void) => {
        console.log('Received chat message:', data);
        if (data.from_user_id === selectedUserId) {
          setMessageHistory((prev) => [...prev, data]);
        }
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === data.from_user_id
              ? { ...chat, lastMessage: data.message, timestamp: new Date(data.created_at).toLocaleString() }
              : chat
          )
        );
        ack('Message received');
      });

      socketRef.current.on('error', (error: string) => {
        console.error('Socket.IO error:', error);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [userId, selectedUserId]);

  // Fetch matches, likes, and views
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/profiles/matched', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data?.matches)) {
          const freshMatches: MatchItem[] = [];
          const freshChats: MatchItem[] = [];

          data.data.matches.forEach((m: any) => {
            if (Array.isArray(m.matched)) {
              const profile = m.matched.find((p: any) => p.user_id !== userId);
              if (profile && profile.user_id) {
                const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
                const matchItem: MatchItem = {
                  id: profile.user_id,
                  name: fullName,
                  image: profile.profile_picture || 'https://via.placeholder.com/150',
                  lastMessage: m.lastMessage || undefined,
                  timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : undefined,
                };
                if (m.lastMessage) {
                  freshChats.push(matchItem);
                } else {
                  freshMatches.push(matchItem);
                }
              }
            }
          });

          setMatches(freshMatches);
          setChats(freshChats);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    const fetchLikes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/likes', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data?.likes)) {
          const likedUsers: LikeUser[] = result.data.likes.map((like: any) => {
            if (Array.isArray(like.matcher) && like.matcher.length > 0) {
              const user = like.matcher[0];
              return {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name || '',
                profile_picture: user.profile_picture || 'https://via.placeholder.com/40',
              };
            }
            return {
              user_id: like.liker_user_id,
              first_name: '',
              last_name: '',
              profile_picture: 'https://via.placeholder.com/40',
            };
          });
          setLikes(likedUsers);
        } else {
          setLikes([]);
        }
      } catch (error) {
        setLikes([]);
      }
    };

    const fetchViews = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/visits', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data?.visits)) {
          setViews(result.data.visits);
        } else {
          setViews([]);
        }
      } catch (error) {
        setViews([]);
      }
    };

    fetchMatches();
    fetchLikes();
    fetchViews();
  }, [userId]);

  // Auto-scroll chat history to bottom
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messageHistory]);

  // Open chat with a user
  const openChat = async (userId: string) => {
    setSelectedUserId(userId);
    setMessageHistory([]);
    try {
      const res = await fetch(`http://localhost:3000/api/chats/${userId}?limit=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setMessageHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Send a message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedUserId) return;
    const messageContent = messageInput.trim();
    const tempMsg: ChatMessage = {
      message_id: generateUniqueId(),
      from_user_id: userId,
      to_user_id: selectedUserId,
      message: messageContent,
      created_at: new Date().toISOString(),
    };
    setMessageHistory((prev) => [...prev, tempMsg]);
    setMessageInput('');
    socketRef.current?.emit('chat message', {
      from: userId,
      message: messageContent,
      timestamp: new Date().toISOString(),
    });
    setChats((prev) => {
      const existing = prev.find((c) => c.id === selectedUserId);
      if (existing) {
        return prev.map((c) =>
          c.id === selectedUserId
            ? { ...c, lastMessage: messageContent, timestamp: new Date().toLocaleString() }
            : c
        );
      }
      const matchItem = matches.find((m) => m.id === selectedUserId);
      if (!matchItem) return prev;
      const newChat: MatchItem = {
        ...matchItem,
        lastMessage: messageContent,
        timestamp: new Date().toLocaleString(),
      };
      return [...prev, newChat];
    });
    setMatches((prev) => prev.filter((m) => m.id !== selectedUserId));
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const renderMatches = () => (
    <div className="matches-list d-flex overflow-auto mb-3">
      {matches.length > 0 ? (
        matches.map((match) => (
          <div
            key={match.id}
            className="match-avatar-container mx-2"
            onClick={() => openChat(match.id)}
          >
            <img src={match.image} alt={match.name} className="match-avatar rounded-circle" />
            <p className="match-name text-center mt-2">{match.name}</p>
          </div>
        ))
      ) : (
        <div className="no-data-message">No new matches.</div>
      )}
    </div>
  );

  const renderChats = () => (
    <div className="chats-list">
      {chats.length > 0 ? (
        chats.map((chat) => (
          <div
            key={chat.id}
            className="chat-item p-3 shadow-sm d-flex align-items-center"
            onClick={() => openChat(chat.id)}
          >
            <img src={chat.image} alt={chat.name} className="chat-avatar rounded-circle" />
            <div className="chat-info ms-3">
              <h5 className="mb-1">{chat.name}</h5>
              <p className="mb-0 text-muted">{chat.lastMessage || 'No messages yet'}</p>
            </div>
            <span className="chat-timestamp text-muted ms-auto">
              {chat.timestamp || ''}
            </span>
          </div>
        ))
      ) : (
        <div className="no-data-message">No chats yet.</div>
      )}
    </div>
  );

  const renderChatWindow = () => {
    if (!selectedUserId) return null;
    const foundChat = chats.find((c) => c.id === selectedUserId);
    const title = foundChat ? foundChat.name : 'Chat';
    return (
      <div className="chat-window mt-3">
        <h5 className="chat-window-title">{title}</h5>
        <div className="chat-history" ref={chatHistoryRef}>
          {messageHistory.map((msg) => (
            <div
              key={msg.message_id}
              className={`message-bubble ${
                msg.from_user_id === userId ? 'message-sent' : 'message-received'
              }`}
            >
              <p className="message-text">{msg.message}</p>
              <small className="text-muted message-timestamp">
                {new Date(msg.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <textarea
            className="form-control"
            rows={2}
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button className="btn btn-success" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    );
  };

  const renderLikesViews = () => (
    <div className="likes-views-section d-flex justify-content-around mt-3">
      <div className="likes-container w-50 px-3">
        <h4>Likes</h4>
        <ul className="list-group">
          {likes.length > 0 ? (
            likes.map((like: LikeUser, index: number) => (
              <li
                key={index}
                className="list-group-item d-flex align-items-center"
                onClick={() => navigate(`/profile/${like.user_id}`)}
              >
                <img
                  src={like.profile_picture}
                  alt={`${like.first_name} ${like.last_name}`.trim() || 'Unknown User'}
                  className="me-3 rounded-circle"
                  width="40"
                  height="40"
                />
                <span>{`${like.first_name} ${like.last_name}`.trim() || 'Unknown User'}</span>
              </li>
            ))
          ) : (
            <div className="no-data-message">There are no likes yet.</div>
          )}
        </ul>
      </div>
      <div className="views-container w-50 px-3">
        <h4>Views</h4>
        <ul className="list-group">
          {views.length > 0 ? (
            views.map((view: any, index: number) => (
              <li key={index} className="list-group-item">
                {view.name || 'Unknown User'}
              </li>
            ))
          ) : (
            <div className="no-data-message">There are no views yet.</div>
          )}
        </ul>
      </div>
    </div>
  );

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
          </div>
          {view === 'matches' && (
            <>
              {renderMatches()}
              {renderChats()}
              {renderChatWindow()}
            </>
          )}
          {view === 'likes' && renderLikesViews()}
        </div>
      </div>
    </>
  );
}

export default Chat;
