import { useState } from "react";
import { User } from "../types/user";
import { useLocalStorage } from "@mantine/hooks";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

export interface QuestionServerResponse<T> {
  success: boolean;
  status: number;
  data: T;
}

export interface UserServerResponse<T> {
  user?: T;
  message: string;
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

  async function fetchData<T>(
    url: string,
    options?: RequestInit,
    suppressWarning?: boolean
  ) {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        ...options,
        headers: {
          ...options?.headers,
          "x-api-key": import.meta.env.VITE_API_KEY as string,
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

      const data: T = await response.json();

      if (!response.ok) {
        // @ts-ignore
        throw new Error(data!.message);
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