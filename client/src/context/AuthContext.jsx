
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("teamflow_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch(() => {
        localStorage.removeItem("teamflow_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token, user: loggedInUser } = response.data;

    localStorage.setItem("teamflow_token", token);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (details) => {
    const response = await api.post("/auth/register", details);
    const { token, user: registeredUser } = response.data;

    localStorage.setItem("teamflow_token", token);
    setUser(registeredUser);

    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem("teamflow_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
