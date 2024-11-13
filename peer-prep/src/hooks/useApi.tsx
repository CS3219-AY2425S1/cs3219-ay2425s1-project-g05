import { useState } from "react";
import { User } from "../types/user";
import { useLocalStorage } from "@mantine/hooks";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

export interface ServerResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// export interface ServerError {
//   message: string;
// }

export enum SERVICE {
  USER,
  QUESTION,
  COLLAB,
  RUN,
  HISTORY,
  AI,
}

export default function useApi() {
  // const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [user, setUser] = useLocalStorage<User | null>({
    key: "user",
    defaultValue: null,
  });

  async function fetchData<Q>(
    url: string,
    service: SERVICE,
    options?: RequestInit,
    suppressWarning?: boolean,
    useCache?: boolean
  ) {
    setIsLoading(true);
    try {
      let baseUrl;
      switch (service) {
        case SERVICE.USER:
          baseUrl = import.meta.env.VITE_API_URL_USER;
          break;
        case SERVICE.QUESTION:
          baseUrl = import.meta.env.VITE_API_URL_QUESTION;
          break;
        case SERVICE.COLLAB:
          baseUrl = import.meta.env.VITE_API_URL_COLLAB;
          break;
        case SERVICE.RUN:
          baseUrl = import.meta.env.VITE_API_URL_RUN;
          break;
        case SERVICE.HISTORY:
          baseUrl = import.meta.env.VITE_API_URL_HISTORY;
          break;
        case SERVICE.AI:
          baseUrl = import.meta.env.VITE_API_URL_AI;
          break;
        default:
          throw new Error("Missing base URL!");
      }

      let response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: {
          ...options?.headers,
          // "x-api-key": import.meta.env.VITE_API_KEY as string,
          // bearer token
          // "Authorization": `Bearer ${accessToken}`,
        },
        credentials: "include",
        cache: useCache ? "force-cache" : "default",
      });

      if (response.status === 401 || response.status === 403) {
        // try to refresh again

        try {
          const isLoggedInNow = await refresh();
          console.log({ canRefresh: isLoggedInNow });

          if (isLoggedInNow) {
            // continue
            // try fetchiong again
            response = await fetch(`${baseUrl}${url}`, {
              ...options,
              headers: {
                ...options?.headers,
                // "x-api-key": import.meta.env.VITE_API_KEY as string,
                // bearer token
                // "Authorization": `Bearer ${accessToken}`,
              },
              credentials: "include",
            });

            if (response.status === 401 || response.status === 403) {
              throw new Error("Refresh failed");
            }
          } else {
            throw new Error("Refresh failed");
          }
        } catch (e) {
          setUser(null);
          navigate("/login");

          throw {
            message: "Login expired or not logged in. Please log in again!",
          };
        }
      }

      if (response.status === 429) {
        // rate limited
        // notifications.show({
        //   title: "Rate limited",
        //   message: "Please try again later.",
        //   color: "red",
        //   autoClose: 5000,
        // });
        throw {
          message:
            "Rate limited. Please do not make too many requests to the serv er.",
        };
      }

      const data: Q = await response.json();

      if (!response.ok) {
        console.log("RESPONSE NOT OK!");
        // @ts-ignore
        throw data;
      }

      // setData(data);
      return data;
    } catch (error) {
      setError(error);

      // throw error again
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, fetchData };
}
