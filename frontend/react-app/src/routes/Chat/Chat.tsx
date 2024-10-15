// src/routes/Chat/Chat.tsx
import NavbarLogged from '../../components/NavbarLogged/NavbarLogged';
import './Chat.css';

function Chat() {
  return (
    <>
      <NavbarLogged />
      <h1 className="display-4 text-center mb-3">Chat</h1>
      <div className="content d-flex flex-column align-items-center justify-content-center">
      </div>
    </>
  );
}

export default Chat;
