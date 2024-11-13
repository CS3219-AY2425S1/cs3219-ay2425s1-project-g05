// src/hooks/AIContext.tsx
import {
  Stack,
  Title,
  Anchor,
  PasswordInput,
  Center,
  Loader,
  Button,
  Text,
  Group,
  Space,
  Flex,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import useApi, { ServerResponse, SERVICE } from "./useApi";
import { User } from "../types/user";

interface AIContextType {
  isApiKeyModalVisible: boolean;
  setApiKeyModalVisible: (visible: boolean) => void;
  hasApiKey: boolean;
  setHasApiKey: (value: boolean) => void;
  openSendApiKeyModal: ({
    roomId,
    user,
    callback,
  }: {
    roomId: string;
    user: User;
    callback?: (...args: any[]) => any;
  }) => void;
  deleteApiKey: ({ roomId, user }: { roomId: string; user: User }) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isApiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false); // Track if the API key is set
  const [sendingApiKey, setSendingApiKey] = useState(false);
  const apiKeyInput = useRef<HTMLInputElement>(null);

  const { fetchData } = useApi();
  const openSendApiKeyModal = ({
    roomId,
    user,
    callback,
  }: {
    roomId: string;
    user: User;
    callback?: (...args: any[]) => any;
  }) => {
    modals.open({
      title: "Enter Your Google AI API Key",
      children: (
        <Stack>
          <Text size="sm" color="dimmed">
            Before we can continue, please enter your Google AI API key. You can
            retrieve it from the
            <Anchor
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              underline="always"
              style={{ marginLeft: "5px" }}
            >
              Google AI Studio
            </Anchor>
            .
          </Text>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendApiKey({ roomId, user, callback });
            }}
          >
            <Stack>
              <PasswordInput
                label="API Key"
                placeholder="Your Google AI API Key"
                mt="md"
                required
                size="md"
                ref={apiKeyInput}
              />
              <Group
                style={{
                  alignItems: "center",
                }}
              >
                <Space flex={1} />
                <Button
                  variant="outline"
                  color="gray"
                  onClick={() => modals.closeAll()}
                  loading={sendingApiKey}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  gradient={{ from: "blue", to: "cyan" }}
                  type="submit"
                  loading={sendingApiKey}
                >
                  Send API Key
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      ),
    });
  };

  async function handleSendApiKey({
    roomId,
    user,
    callback,
  }: {
    roomId: string;
    user: User;
    callback?: (...args: any[]) => any;
  }) {
    setSendingApiKey(true);

    modals.closeAll();
    modals.open({
      withCloseButton: false,
      closeOnClickOutside: false,
      closeOnEscape: false,
      title: "Submitting API key...",
      children: (
        <Flex
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Loader size="lg" />
          <Title order={4} style={{ textAlign: "center" }}>
            {" "}
            Submitting your API key...{" "}
          </Title>
          <Text style={{ textAlign: "center" }}>
            {" "}
            The server needs to test your API key to ensure it works. Please be
            patient!
          </Text>
        </Flex>
      ),
    });

    // Send the API key to the AI service
    try {
      // If the response is successful, close the modal and set the hasApiKey to true
      const apiKey = apiKeyInput.current.value;
      console.log("api key!! = ", apiKey);

      const response = await fetchData<
        ServerResponse<{
          userId: string;
          roomId: string;
        }>
      >(`/gen-ai-service/create-session`, SERVICE.AI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          roomId: roomId,
          apiKey: apiKey,
        }),
      });
      console.log("API Key sent successfully", response);
      setSendingApiKey(false);

      setHasApiKey(true);

      notifications.show({
        title: "API key set successfully",
        message: "You can now use the AI features.",
        color: "green",
      });

      modals.closeAll();

      if (callback) {
        callback();
      }
    } catch (error: any) {
      // If there is an error, show a notification with the error message and keep the modal open for the user to try again
      console.error("Error sending API key", error);
      notifications.show({
        title: "Error sending API key, please try again",
        message: error.message,
        color: "red",
      });
      setSendingApiKey(false);

      openSendApiKeyModal({ roomId, user, callback });
    } finally {
    }
  }

  function deleteApiKey({ roomId, user }: { roomId: string; user: User }) {
    fetchData<ServerResponse<{ userId: string; roomId: string }>>(
      `/gen-ai-service/delete-session`,
      SERVICE.AI,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          roomId: roomId,
        }),
      }
    )
      .then((response) => {
        console.log("API Key deleted successfully", response);
        setHasApiKey(false);

        // notifications.show({
        //   title: "API key deleted successfully",
        //   message: "You can no longer use the AI features.",
        //   color: "green",
        // });
      })
      .catch((error) => {
        console.error("Error deleting API key", error);
        // notifications.show({
        //   title: "Error deleting API key, please try again",
        //   message: error.message,
        //   color: "red",
        // });
      });
  }
  useEffect(() => {
    // onunload, delete the api key
  }, []);

  return (
    <AIContext.Provider
      value={{
        isApiKeyModalVisible,
        setApiKeyModalVisible,
        hasApiKey,
        setHasApiKey,
        openSendApiKeyModal,
        deleteApiKey,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAi must be used within an AIProvider");
  }
  return context;
};
