import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './chat.css';
import { useState, useEffect } from 'react';

type Match = {
  id: number;
  name: string;
  image: string;
  lastMessage?: string;
  timestamp?: string;
};

type Like = {
  id: number;
  name: string;
};

type View = {
  id: number;
  name: string;
};

function Chat() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [view, setView] = useState<'matches' | 'likes'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [views, setViews] = useState<View[]>([]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        const result = await response.json();

        if (result.status === "fail" && result.data === "profile not found") {
          window.location.href = '/create-profile';
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        window.location.href = '/create-profile';
      }
    };

    checkProfile();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/matched', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        
        if (Array.isArray(result)) {
          setMatches(result);
        } else {
          console.error('Expected an array for matches, but got:', result);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/matched', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        setChats(result.map((match: any) => ({
          matchId: match.id,
          lastMessage: match.lastMessage || 'No messages yet',
          timestamp: match.timestamp || 'N/A',
        })));
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    const fetchLikes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/likes', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        
        if (Array.isArray(result)) {
          setLikes(result);
        } else {
          console.error('Expected an array for likes, but got:', result);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    const fetchViews = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/visits', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        
        if (Array.isArray(result)) {
          setViews(result);
        } else {
          console.error('Expected an array for views, but got:', result);
        }
      } catch (error) {
        console.error('Error fetching views:', error);
      }
    };

    fetchMatches();
    fetchChats();
    fetchLikes();
    fetchViews();
  }, []);

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
              <div className="matches-section d-flex overflow-auto mb-3">
                {matches.length > 0 ? (
                  matches.map((match: Match) => (
                    <div
                      key={match.id}
                      className="match-avatar-container mx-2"
                      onClick={() => setSelectedChat(match.id)}
                    >
                      <img src={match.image} alt={match.name} className="match-avatar rounded-circle" />
                      <p className="match-name text-center mt-2">{match.name}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-data-message">There are no matches yet.</div>
                )}
              </div>

              <div className="chat-list">
                {chats.length > 0 ? (
                  chats
                    .filter((chat: any) => selectedChat === null || chat.matchId === selectedChat)
                    .map((chat: any, index: number) => {
                      const match = matches.find((m: any) => m.id === chat.matchId);
                      if (!match) return null;
                      return (
                        <div key={index} className="chat-item p-3 shadow-sm d-flex align-items-center">
                          <img src={match.image} alt={match.name} className="chat-avatar rounded-circle" />
                          <div className="chat-info ms-3">
                            <h5 className="mb-1">{match.name}</h5>
                            <p className="mb-0 text-muted">{chat.lastMessage}</p>
                          </div>
                          <span className="chat-timestamp text-muted ms-auto">{chat.timestamp}</span>
                        </div>
                      );
                    })
                ) : (
                  <div className="no-data-message">There are no chats yet.</div>
                )}
              </div>
            </>
          )}

          {view === 'likes' && (
            <div className="likes-views-section d-flex justify-content-around mt-3">
              <div className="likes-container w-50 px-3">
                <h4>Likes</h4>
                <ul className="list-group">
                  {Array.isArray(likes) && likes.length > 0 ? (
                    likes.map((like: any, index: number) => (
                      <li key={index} className="list-group-item">
                        {like.name || 'Unknown User'}
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
                  {Array.isArray(views) && views.length > 0 ? (
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
          )}
        </div>
      </div>
    </>
  );
}

export default Chat;
