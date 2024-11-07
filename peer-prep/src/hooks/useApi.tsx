import { useState } from "react";
import { User } from "../types/user";
import { useLocalStorage } from "@mantine/hooks";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

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

  const [user, setUser] = useLocalStorage<User | null>({
    key: "user",
    defaultValue: null,
  });

  async function fetchData<Q>(
    url: string,
    service: SERVICE,
    options?: RequestInit,
    suppressWarning?: boolean
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

      const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers: {
          ...options?.headers,
          // "x-api-key": import.meta.env.VITE_API_KEY as string,
          // bearer token
          // "Authorization": `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      // if the response status indicates not logged in, clear data and redirect to login
      // if (response.status === 401) {
      //   //
      //   //
      //   return;
      // }

      if (response.status === 401) {
        setUser(null);
        navigate("/login");
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
