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
  // We adapt to your local structure but remember the server "chat message" event has { from, message, timestamp }
  chat_id: string;           
  sender_user_id: string;    
  receiver_user_id: string;  
  message: string;           
  sent_at: string;           
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

  // 1. Fetch user profile to get userId
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.status === 'success') {
          setUserId(result.data.user_id);
        } else {
          window.location.href = '/create-profile';
        }
      } catch (error) {
        window.location.href = '/create-profile';
      }
    };
    fetchUserProfile();
  }, []);

  // 2. Connect to Socket.IO via wss://localhost:3000/api/chat
  useEffect(() => {
    if (userId) {
      const token = getCookie('jwt');
      if (!token) return;

      socketRef.current = io('wss://localhost:3000/api/chat', {
        auth: { token: `Bearer ${token}` },
      });

      socketRef.current.on('connect', () => {
        console.log('Successfully connected to the chat namespace.');
      });

      // Handle incoming chat message from the server
      socketRef.current.on(
        'chat message',
        (
          data: {
            from: string;
            message: string;
            timestamp: string;
            // If your server sends more fields, add them here
          },
          ack: (response: string) => void
        ) => {
          console.log('New chat message:', data);

          // Transform server data -> local ChatMessage shape
          // The server doc shows: { from, message, timestamp }
          // We do not get 'receiver_user_id' directly, so let's assume it's the current user:
          const newMsg: ChatMessage = {
            chat_id: Math.random().toString(36).substring(2, 15),
            sender_user_id: data.from,
            receiver_user_id: userId,
            message: data.message,
            sent_at: data.timestamp,
          };

          // If the message is relevant to the currently opened user, add it
          // For a private chat, if newMsg.sender_user_id == selectedUserId or newMsg.receiver_user_id == selectedUserId
          if (
            newMsg.sender_user_id === selectedUserId ||
            newMsg.receiver_user_id === selectedUserId
          ) {
            setMessageHistory((prev) => {
              const newHistory = [...prev, newMsg];
              // Keep them sorted ascending by sent_at
              return newHistory.sort(
                (a, b) =>
                  new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
            });
          }

          // Update 'chats' list to show last message
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === data.from
                ? {
                    ...chat,
                    lastMessage: data.message,
                    timestamp: new Date(data.timestamp).toLocaleString(),
                  }
                : chat
            )
          );

          // Acknowledge receipt
          ack('Message received');
        }
      );

      // Handle error events
      socketRef.current.on('error', (error: string) => {
        console.error('An error occurred:', error);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [userId, selectedUserId]);

  // 3. Fetch matches, likes, and views
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
            const profile = m.matched?.find((p: any) => p.user_id !== userId);
            if (profile?.user_id) {
              const fullName =
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                'Unknown User';
              const matchItem: MatchItem = {
                id: profile.user_id,
                name: fullName,
                image: profile.profile_picture || 'https://via.placeholder.com/150',
                lastMessage: m.lastMessage,
                timestamp: m.timestamp
                  ? new Date(m.timestamp).toLocaleString()
                  : undefined,
              };
              if (m.lastMessage) {
                freshChats.push(matchItem);
              } else {
                freshMatches.push(matchItem);
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
          setLikes(
            result.data.likes.map((like: any) => {
              const user = like.matcher?.[0];
              return user
                ? {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name || '',
                    profile_picture:
                      user.profile_picture || 'https://via.placeholder.com/40',
                  }
                : {
                    user_id: like.liker_user_id,
                    first_name: '',
                    last_name: '',
                    profile_picture: 'https://via.placeholder.com/40',
                  };
            })
          );
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

    if (userId) {
      fetchMatches();
      fetchLikes();
      fetchViews();
    }
  }, [userId]);

  // 4. Scroll chat to bottom when messages update
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messageHistory]);

  // 5. Open chat history
  const openChat = async (clickedUserId: string) => {
    setSelectedUserId(clickedUserId);
    setMessageHistory([]);

    try {
      const res = await fetch(`http://localhost:3000/api/chats/${clickedUserId}?limit=20`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.data?.chats)) {
        // Sort the messages ascending by sent_at
        const sortedMessages = data.data.chats.sort(
          (a: ChatMessage, b: ChatMessage) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );
        setMessageHistory(sortedMessages);
      } else {
        console.error('Unexpected response:', data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // 6. Send message (both via REST to store in DB, and socket for real-time)
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;
    const messageContent = messageInput.trim();
    setMessageInput('');

    // Create a temp message for optimistic UI
    const tempMsg: ChatMessage = {
      chat_id: Math.random().toString(36).substring(2, 15),
      sender_user_id: userId,
      receiver_user_id: selectedUserId,
      message: messageContent,
      sent_at: new Date().toISOString(),
    };

    // Insert it in ascending order
    setMessageHistory((prev) => {
      const newArr = [...prev, tempMsg];
      return newArr.sort(
        (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
    });

    // ---- POST to your API to store the message in the DB ----
    try {
      const response = await fetch(`http://localhost:3000/api/chats/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageContent }),
      });
      if (!response.ok) {
        throw new Error(`Error sending message: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        if (Array.isArray(data.data?.chats)) {
          // If the server returns an array of all messages
          const sortedMessages = data.data.chats.sort(
            (a: ChatMessage, b: ChatMessage) =>
              new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
          setMessageHistory(sortedMessages);
        } else if (data.data?.chat) {
          // If the server returns only the new message
          const newMsg = data.data.chat as ChatMessage;
          setMessageHistory((prev) => {
            const filtered = prev.filter((m) => m.chat_id !== tempMsg.chat_id);
            const newArr = [...filtered, newMsg];
            return newArr.sort(
              (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            );
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // You might want to handle rolling back the optimistic message if the server fails
    }

    // ---- Emit via Socket.IO for real-time updates ----
    // The docs show: socket.emit("chat message", { msg: "Hello", receiver: "user_id" });
    socketRef.current?.emit('chat message', {
      msg: messageContent,
      receiver: selectedUserId,
      timestamp: new Date().toISOString(), // If needed
    });

    // Update or create the chat in the "chats" list
    setChats((prev) => {
      const existing = prev.find((c) => c.id === selectedUserId);
      if (existing) {
        return prev.map((c) =>
          c.id === selectedUserId
            ? {
                ...c,
                lastMessage: messageContent,
                timestamp: new Date().toLocaleString(),
              }
            : c
        );
      } else {
        const matchItem = matches.find((m) => m.id === selectedUserId);
        if (matchItem) {
          return [
            ...prev,
            {
              ...matchItem,
              lastMessage: messageContent,
              timestamp: new Date().toLocaleString(),
            },
          ];
        }
        return prev;
      }
    });

    // Remove from "matches" if it was there
    setMatches((prev) => prev.filter((m) => m.id !== selectedUserId));
  };

  // Renders the small matches avatars
  const renderMatches = () => (
    <div className="matches-list d-flex overflow-auto mb-3">
      {matches.length > 0 ? (
        matches.map((match) => (
          <div
            key={match.id}
            className="match-avatar-container mx-2"
            onClick={() => openChat(match.id)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={match.image}
              alt={match.name}
              className="match-avatar rounded-circle"
            />
            <p className="match-name text-center mt-2">{match.name}</p>
          </div>
        ))
      ) : (
        <div className="no-data-message">No new matches.</div>
      )}
    </div>
  );

  // Renders the list of chats
  const renderChats = () => (
    <div className="chats-list">
      {chats.length > 0 ? (
        chats.map((chat) => (
          <div
            key={chat.id}
            className="chat-item p-3 shadow-sm d-flex align-items-center"
            onClick={() => openChat(chat.id)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={chat.image}
              alt={chat.name}
              className="chat-avatar rounded-circle"
            />
            <div className="chat-info ms-3">
              <h5 className="mb-1">{chat.name}</h5>
              <p className="mb-0 text-muted">
                {chat.lastMessage || 'No messages yet'}
              </p>
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

  // Renders the chat conversation window
  const renderChatWindow = () => {
    if (!selectedUserId) return null;
    const foundChat = chats.find((c) => c.id === selectedUserId);

    return (
      <div className="chat-window mt-3">
        <h5 className="chat-window-title">{foundChat?.name || 'Chat'}</h5>
        <div className="chat-history" ref={chatHistoryRef}>
          {messageHistory.map((msg) => (
            <div
              key={msg.chat_id}
              className={`message-bubble ${
                msg.sender_user_id === userId ? 'message-sent' : 'message-received'
              }`}
            >
              <p className="message-text">{msg.message}</p>
              <small className="text-muted message-timestamp">
                {new Date(msg.sent_at).toLocaleString()}
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
              // Send on Enter (no Shift)
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

  // Renders the Likes & Views section
  const renderLikesViews = () => (
    <div className="likes-views-section d-flex justify-content-around mt-3">
      <div className="likes-container w-50 px-3">
        <h4>Likes</h4>
        <ul className="list-group">
          {likes.length > 0 ? (
            likes.map((like, index) => (
              <li
                key={index}
                className="list-group-item d-flex align-items-center"
                onClick={() => navigate(`/profile/${like.user_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={like.profile_picture}
                  alt={`${like.first_name} ${like.last_name}`.trim() || 'Unknown User'}
                  className="me-3 rounded-circle"
                  width="40"
                  height="40"
                />
                <span>
                  {`${like.first_name} ${like.last_name}`.trim() || 'Unknown User'}
                </span>
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
            views.map((view, index) => (
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
              className={`btn ${
                view === 'matches' ? 'btn-primary' : 'btn-outline-primary'
              } mx-2`}
              onClick={() => setView('matches')}
            >
              Matches & Chats
            </button>
            <button
              className={`btn ${
                view === 'likes' ? 'btn-primary' : 'btn-outline-primary'
              } mx-2`}
              onClick={() => setView('likes')}
            >
              Likes & Views
            </button>
          </div>

          {view === 'matches' ? (
            <>
              {renderMatches()}
              {renderChats()}
              {renderChatWindow()}
            </>
          ) : (
            renderLikesViews()
          )}
        </div>
      </div>
    </>
  );
}

export default Chat;
