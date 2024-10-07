import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Root.css';

function App() {
  return (
    <>
      <Navbar /> {}
      <div className="content">
        <h1>Welcome to Matcha!</h1>
        <Link to="/signup">
          <button className="create-account-button">Create Account</button>
        </Link>
      </div>
    </>
  );
}

export default App;
