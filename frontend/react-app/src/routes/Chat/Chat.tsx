// src/routes/Chat/Chat.tsx
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './chat.css';
import { useState } from 'react';

const matches = [
  { id: 1, name: 'Alice', image: 'https://via.placeholder.com/400x500' },
  { id: 2, name: 'Bob', image: 'https://via.placeholder.com/400x500' },
  { id: 3, name: 'Charlie', image: 'https://via.placeholder.com/400x500' },
];

const chats = [
  { id: 1, matchId: 1, lastMessage: 'Hey! How are you?', timestamp: '10:30 AM' },
  { id: 2, matchId: 2, lastMessage: 'Had a great time yesterday!', timestamp: 'Yesterday' },
  { id: 3, matchId: 3, lastMessage: 'Let’s catch up soon!', timestamp: 'Monday' },
];

function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <>
      <NavbarLogged />
      <div className="content d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="card text-center p-3 shadow-lg chat-card">
          <div className="matches-section d-flex overflow-auto mb-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="match-avatar-container mx-2"
                onClick={() => setSelectedChat(match.id)}
              >
                <img src={match.image} alt={match.name} className="match-avatar rounded-circle" />
                <p className="match-name text-center mt-2">{match.name}</p>
              </div>
            ))}
          </div>

          <div className="chat-list w-100 mt-3">
            {chats
              .filter((chat) => selectedChat === null || chat.matchId === selectedChat)
              .map((chat) => {
                const match = matches.find((m) => m.id === chat.matchId);
                return (
                  <div key={chat.id} className="chat-item p-3 shadow-sm d-flex align-items-center">
                    <img src={match.image} alt={match.name} className="chat-avatar rounded-circle" />
                    <div className="chat-info ms-3">
                      <h5 className="mb-1">{match.name}</h5>
                      <p className="mb-0 text-muted">{chat.lastMessage}</p>
                    </div>
                    <span className="chat-timestamp text-muted ms-auto">{chat.timestamp}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
