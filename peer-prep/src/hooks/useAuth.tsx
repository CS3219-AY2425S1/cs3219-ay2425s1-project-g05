import { useLocalStorage } from "@mantine/hooks";
import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { User, UserResponseData } from "../types/user";
import useApi, { ServerResponse, SERVICE } from "./useApi";
import { notifications } from "@mantine/notifications";
export enum AUTH_STATUS {
  LOGGED_IN,
  LOGGED_OUT,
  LOADING,
}
export interface AuthContextType {
  user: User | null;
  login: (data: any) => void;
  logout: () => void;
  register: (data: any) => void;
  authStatus: AUTH_STATUS;
  refresh: () => Promise<boolean>;
  refreshForWs: () => Promise<void>;
}

const DEFAULT_TEMP_USER: User = {
  email: "johndoe@gmail.com",
  displayName: "John Doe",
  isAdmin: false,
  _id: "123",
  // password: "password",
};

const DEFAULT: AuthContextType = {
  user: DEFAULT_TEMP_USER, // TODO: switch this out later
  login: () => {
    console.log("log");
  },
  logout: () => {},
  register: () => {},
  authStatus: AUTH_STATUS.LOADING,
  refresh: () => Promise.resolve(false),
  refreshForWs: () => Promise.resolve(),
};
const AuthContext = createContext<AuthContextType>(DEFAULT);

export const AuthProvider = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}) => {
  const [user, setUser] = useLocalStorage<User | null>({
    key: "user",
    defaultValue: undefined,
  });

  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.LOADING);

  console.log({ authStatus });

  useEffect(() => {
    console.log(`log: user changed: `, user);
    if (user === null) {
      setAuthStatus(AUTH_STATUS.LOGGED_OUT);
    } else if (user && user._id) {
      // if this is a valid user
      setAuthStatus(AUTH_STATUS.LOGGED_IN);
    }
  }, [user]);

  const { fetchData, isLoading, error } = useApi();
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const login = async (data: { email: string; password: string }) => {
    fetchData<ServerResponse<UserResponseData>>(
      `/user-service/users/login`,
      SERVICE.USER,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      false,
      false,
      true
    )
      .then((response) => {
        // ok!
        setUser(response.data.user || null);
        console.log(response.data.user, "<<<<");
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

  // this function will be called when the access token expires
  // if you have a refresh token, you can use it to get a new access token
  // if not, logout
  // if the refresh token call fails, logout
  const refresh = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL_USER}/user-service/users/regen`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      console.log({ response });
      if (!response.ok) {
        console.error("ERROR:: Refresh token failed in response.ok");
        // setUser(null);
        // navigate("/login");
        return false;
      }

      return true;
    } catch (e) {
      console.error("ERROR:: Refresh token failed", e);
      // setUser(null);
      // navigate("/login");
      return false;
    }

    // fetchData<ServerResponse<void>>(`/user-service/users/regen`, SERVICE.USER, {
    //   method: "POST",
    // })
    //   .then((response) => {
    //     console.log(
    //       `LOG: ✅✅ refresh token used to refresh session successfully`
    //     );
    //   })
    //   .catch((error) => {
    //     console.error(error);

    //     // notifications.show()
    //   });
  };

  // also handle showing notifications
  const refreshForWs = async () => {
    const canRefresh = await refresh();
    console.log(`LOG: canRefresh: ${canRefresh} for websocket connection`);
    if (!canRefresh) {
      // failed to refresh,
      // show notification,
      // redirect to home
      notifications.show({
        message: "Login expired or not logged in. Please log in again!",
        title: "Error",
        color: "red",
      });
      setUser(null);
      navigate("/login");

      return;
    } else {
      // don't say anything
      return;
    }
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
      authStatus,
      refresh,
      refreshForWs,
    }),
    [user, authStatus]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
