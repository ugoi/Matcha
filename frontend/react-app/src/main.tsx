import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import Root from "./routes/Root/Root.tsx";
import Signup from "./routes/Signup/Signup.tsx";
import About from "./routes/About/About.tsx";
import Home from "./routes/Home/Home.tsx";
import Login from "./routes/Login/Login.tsx";


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
    element: <About />
  },
  {
    path: "/home",
    element: <Home />
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
