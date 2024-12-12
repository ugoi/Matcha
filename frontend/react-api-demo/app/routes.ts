import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/Home.tsx"),
  route("signup", "routes/Signup.tsx"),
  route("login", "routes/Login.tsx"),
] satisfies RouteConfig;
