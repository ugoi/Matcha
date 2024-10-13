// src/routes/Root/Root.tsx
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./Root.css";

function App() {
  return (
    <>
      <Navbar />
      <div className="content d-flex flex-column align-items-center justify-content-center">
        <h1 className="display-4 text-center mb-3">Welcome to Matcha!</h1>
        <Link to="/signup">
          <button className="btn btn-primary btn-lg">Create User</button>
        </Link>
      </div>
    </>
  );
}

export default App;
