import { useState } from "react";
import { User } from "../types/user";
import { useLocalStorage } from "@mantine/hooks";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

export interface QuestionServerResponse<T> {
  success: boolean;
  status: number;
  data: T;
  message?: string;
}

export interface UserServerResponse<T> {
  user?: T;
  message: string;
}

// export interface ServerError {
//   message: string;
// }

export enum SERVICE {
  USER,
  QUESTION,
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
      // todo make this nicer...
      const response = await fetch(
        `${
          service === SERVICE.USER
            ? import.meta.env.VITE_API_URL_USER
            : import.meta.env.VITE_API_URL_QUESTION
        }${url}`,
        {
          ...options,
          headers: {
            ...options?.headers,
            // "x-api-key": import.meta.env.VITE_API_KEY as string,
            // bearer token
            // "Authorization": `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );

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
