import { useLocalStorage } from "@mantine/hooks";
import { createContext, ReactElement, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types/user";
import useApi, { SERVICE, UserServerResponse } from "./useApi";
import { notifications } from "@mantine/notifications";

export interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
  register: (data: any) => void;
}

const DEFAULT_TEMP_USER: User = {
  email: "johndoe@gmail.com",
  displayName: "John Doe",
  isAdmin: false,
  id: "123",
  // password: "password",
};

const DEFAULT: AuthContextType = {
  user: DEFAULT_TEMP_USER, // TODO: switch this out later
  login: () => {
    console.log("log");
  },
  logout: () => {},
  register: () => {},
};
const AuthContext = createContext<AuthContextType>(DEFAULT);

export const AuthProvider = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}) => {
  const [user, setUser] = useLocalStorage<User | null>({
    key: "user",
    defaultValue: null,
  });

  const { fetchData, isLoading, error } = useApi();
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const login = async (data: { email: string; password: string }) => {
    fetchData<UserServerResponse<User>>(
      `/user-service/users/login`,
      SERVICE.USER,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((data) => {
        // ok!
        setUser(data.user || null);
        console.log(data.user, "<<<<");
        navigate("/dashboard", { replace: true });

        notifications.show({
          message: "Welcome to PeerPrep!",
          title: "Login successful",
          color: "green",
        });
      })
      .catch((e) => {
        console.log("ERROR:: Login failed", e);

        notifications.show({
          message: e.message || "Login failed",
          title: "Error - Login failed!",
          color: "red",
        });
      });
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
  }) => {
    fetchData(`/user-service/users`, SERVICE.USER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((_) => {
        // ok!
        notifications.show({
          message: "Registration successful",
          color: "green",
        });

        // need to login to set cookie
        login({
          email: data.email,
          password: data.password,
        });
        return;
      })
      .catch((e) => {
        console.error("ERROR:: Registration failed");

        notifications.show({
          message: e.message || "Registration failed",
          title: "Error - Registration failed!",
          color: "red",
        });
      });
    // const response = await fetch(`/user-service/users`);

    // if (!response.ok) {
    //   console.error("ERROR:: Registration failed");
    //   return;
    // }

    // if (response.status === 201) {
    //   console.log("INFO:: Registration successful");

    //   // login the user
    // }
  };

  // call this function to sign out logged in user
  const logout = () => {
    fetchData(`/user-service/users/logout`, SERVICE.USER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((_) => {
        // ok!
        setUser(null);
        navigate("/", { replace: true });

        notifications.show({
          message: "Logged out",
          title: "Success",
          color: "green",
        });
      })
      .catch((e) => {
        console.error("ERROR:: Logout failed");
      });
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      register,
    }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
