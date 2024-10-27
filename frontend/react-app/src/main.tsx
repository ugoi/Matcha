import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import Root from "./routes/Root/Root.tsx";
import Signup from "./routes/Signup/Signup.tsx";
import Login from "./routes/Login/Login.tsx";
import About from "./routes/About/About.tsx";
import Home from "./routes/Home/Home.tsx";
import Profile from "./routes/Profile/Profile.tsx";
import Chat from "./routes/Chat/Chat.tsx";
import Settings from "./routes/Settings/Settings.tsx";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/check-auth", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        if (data.status === "success") {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch((error) => {
        console.error(error);
        setIsLoggedIn(false);
        setIsLoggedIn(true); //comment this for make the check-auth work
      });
  }, []);
  
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/about",
      element: <About />,
    },
    {
      path: "/home",
      element: isLoggedIn ? <Home /> : <Navigate to="/" />,
    },
    {
      path: "/profile",
      element: isLoggedIn ? <Profile /> : <Navigate to="/" />,
    },
    {
      path: "/chat",
      element: isLoggedIn ? <Chat /> : <Navigate to="/" />,
    },
    {
      path: "/settings",
      element: isLoggedIn ? <Settings /> : <Navigate to="/" />,
    }
  ]);

  if (isLoggedIn === null) {
    return <div>Loading...</div>;
  }

  return <RouterProvider router={router} />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
