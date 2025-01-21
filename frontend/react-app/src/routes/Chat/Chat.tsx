import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './chat.css';
import { useState, useEffect } from 'react';

type Match = {
  id: string;
  name: string;
  image: string;
  lastMessage?: string;
  timestamp?: string;
};

function Chat() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [view, setView] = useState<'matches' | 'likes'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch(`${window.location.origin}/api/profiles/me`);
        const result = await response.json();
        if (result.status === "fail" && result.data === "profile not found") {
          window.location.href = '/create-profile';
        }
      } catch (error) {
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
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data?.matches)) {
          const transformed = result.data.matches.map((m: any) => {
            if (!m.matched || !Array.isArray(m.matched)) {
              return null;
            }
            // Choose whichever profile is the 'other' user for displaying
            // Here, we just take the first one in 'matched'
            // Adjust logic if you need to pick the second or check user IDs
            const profile = m.matched[0];
            return {
              id: profile.user_id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
              image: profile.profile_picture || 'https://via.placeholder.com/150'
            };
          }).filter(Boolean);
          setMatches(transformed);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/matched', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data?.matches)) {
          const chatData = result.data.matches.map((m: any) => {
            return {
              matchId: m.liker_user_id, 
              lastMessage: m.lastMessage || 'No messages yet',
              timestamp: m.timestamp || 'N/A'
            };
          });
          setChats(chatData);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    const fetchLikes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/profiles/likes', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
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
          headers: { 'Content-Type': 'application/json' }
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
                {matches && matches.length > 0 ? (
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
                {chats && chats.length > 0 ? (
                  chats
                    .filter((chat) => selectedChat === null || chat.matchId === selectedChat)
                    .map((chat: any, index: number) => {
                      const match = matches.find((m: Match) => m.id === chat.matchId);
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
                  {likes && likes.length > 0 ? (
                    likes.map((like, index) => (
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
                  {views && views.length > 0 ? (
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
          )}
        </div>
      </div>
    </>
  );
}

export default Chat;
