/*
TODO list:
1. add message deletion
2. handle missing messions
3. add notification when minimized and new messages
4. 
*/

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Code,
  Collapse,
  Flex,
  Group,
  Indicator,
  Input,
  Kbd,
  Menu,
  Radio,
  rem,
  Select,
  Space,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { createContext, useEffect, useRef, useState } from "react";

import classes from "./TextChatWidget.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { socket } from "../../../websockets/communication/socket";
import {
  IconAi,
  IconArrowDown,
  IconArrowNarrowDown,
  IconArrowsLeftRight,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconBrandGithubCopilot,
  IconCamera,
  IconCancel,
  IconCaretUpFilled,
  IconCornerLeftUp,
  IconCornerRightUp,
  IconCornerUpRight,
  IconCurrencyLeu,
  IconEye,
  IconEyeOff,
  IconMailAi,
  IconMessageCircle,
  IconPhone,
  IconPhoneFilled,
  IconPhoto,
  IconSearch,
  IconSend,
  IconSend2,
  IconSettings,
  IconTrash,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import {
  useInViewport,
  useLocalStorage,
  useMouse,
  useTimeout,
} from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  formatTime,
  generateReactObjects,
  splitTextIntoObjects,
} from "../../../utils/utils";
import VideoChatWidget from "../Video/VideoChatWidget";
import { User } from "../../../types/user";

import GeminiIcon from "../../../assets/integrations/google-gemini-icon.svg";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { CodeHighlight } from "@mantine/code-highlight";
import { useAi } from "../../../hooks/useAi";
import { text } from "stream/consumers";

enum ChatState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

const ChatStateText = {
  0: "Disconnected",
  1: "Connecting",
  2: "Connected",
};

enum MessageState {
  SENDING,
  BEFORE_SEND,
}

type Message = {
  sender: ChatRoomUser;
  content: string | any;
  timestamp: Date;
  messageId: string;
  replyToId?: string;

  integration?: string; // "gemini_1.0"
};

// not used
type ChatRoomEnterExitEvent = {
  userSocketId: string;
  userId: string;
  timestamp: Date;
};

type ChatRoomUser = {
  userId: string;
  userSocketId: string;
  name: string;
  email: string;
};
type ChatRoomUpdateEvent = {
  users: ChatRoomUser[];
};

type IntegrationError = {
  [integrationId: string]: { error: string };
};

interface TextChatWidgetProps {
  roomId: string;
  question: string;
  solutionCode: string;
}
type IntegrationId = "gemini_1.0";
type SendTarget = "person" | IntegrationId;

// todo do this when got more time
// enum IntegrationType {
//   GEMINI = "gemini_1.0",
// }

// enum SendTargetType {
//   PERSON = "person",
//   INTEGRATION = "integration",
// }

interface AiChatResponse {
  reply: string;
}

enum AiAssistButtonType {
  GEN_HINTS,
  GEN_SOLUTION,
  CODE_EXPLANATION,
  QUESTION_EXPLANATION,
}

export default function TextChatWidget({
  roomId,
  question,
  solutionCode,
}: TextChatWidgetProps) {
  const { user } = useAuth();
  const { colorScheme } = useMantineColorScheme();

  const { hasApiKey, openSendApiKeyModal, setHasApiKey, deleteApiKey } =
    useAi();

  const [messageState, setMessageState] = useState<MessageState>(
    MessageState.BEFORE_SEND
  );

  const [chatState, setChatState] = useState<ChatState>(ChatState.DISCONNECTED);
  const [usersInRoom, setUsersInRoom] = useState<ChatRoomUser[]>([]);
  const [usersSeenSoFar, setUsersSeenSoFar] = useState<ChatRoomUser[]>([]);
  const [socketUserId, setSocketUserId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [unreadMessages, setUnreadMessages] = useState(0);

  const [defaultSendTo, setDefaultSendTo] = useState<SendTarget>("person");
  const [isSendToMenuOpen, setIsSendToMenuOpen] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(true);

  const [isAiChat, setIsAiChat] = useState(false);
  const [aiButtonType, setAiButtonType] = useState<AiAssistButtonType | null>();

  const [integrationErrorState, setIntegrationErrorState] =
    useState<IntegrationError>({});

  const chatContentRef = useRef<HTMLDivElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resetState = () => {
    setReplyToMessage(null);
    setSelectedMessage(null);
  };

  // for replying
  const onMessageClicked = (msg: Message | null) => {
    if (chatState !== ChatState.CONNECTED) return;
    setReplyToMessage(msg);
    setSelectedMessage(msg);

    // focus on the input
    inputRef.current?.focus();
  };

  // max 3 re-tries
  const [connectTries, setConnectTries] = useState(0);

  const { start: startSendTimeout, clear: clearSendTimeout } = useTimeout(
    () => {
      // if message is still in sending state after 2 seconds, there's some error
      notifications.show({
        message: "Please check your internet connection",
        title: "Error sending message",
        color: "red",
      });

      // try to connect to the room
      setMessageState(MessageState.BEFORE_SEND);
      // setChatState(ChatState.DISCONNECTED);
      // console.log(`HUH: ${chatState}`);
      // requestAnimationFrame(() => {
      //   console.log(`HUH in RAF: ${chatState}`);

      //   onConnectToChat();
      // });
    },
    2000
  );

  const onConnectToChat = () => {
    console.log(`HUH in function: ${chatState}`);

    socket.connect();

    setChatState(ChatState.CONNECTING);
  };
  const onJoinRoom = () => {
    if (roomId.trim() === "") return;
    console.log(`Room ID: ${roomId}`);

    socket.emit("join-room", {
      roomId,
      user: {
        userId: user._id,
        name: user.displayName,
        email: user.email,
      },
    });
  };

  const onSendButtonClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    console.log({ e });
    if (e.type === "click") {
      e.stopPropagation();
      e.preventDefault();
      if (defaultSendTo === "gemini_1.0") {
        setIsAiChat(true);
      }
      onBeforeSendMessage();
    } else if (e.type === "contextmenu") {
      e.stopPropagation();
      e.preventDefault();
      setIsSendToMenuOpen((prev) => !prev);
    }
  };

  // choose where to send the message
  const onBeforeSendMessage = () => {
    if (messageState === MessageState.SENDING) return;
    if (defaultSendTo === "person") {
      onSendMessage();
    } else if (defaultSendTo === "gemini_1.0") {
      if (hasApiKey) {
        console.log("user already keyed in their api key");
        onSendAiMessage();
      } else {
        console.log("user has not keyed in their api key");
        openSendApiKeyModal({ roomId, user, callback: onSendAiMessage });
      }
    }
  };
  const onSendMessage = () => {
    if (draftMessage.trim() === "") return;
    console.log("LOG: sending message", {
      roomId,
      message: draftMessage,
      replyToId: replyToMessage?.messageId,
    });

    // set a timer for sending for 2 seconds,
    // if after 2 seconds, the message is still in sending state, there's some error
    startSendTimeout();
    socket.emit("chat-message", {
      roomId: roomId,
      message: draftMessage,
      replyToId: replyToMessage?.messageId,
    });
    setMessageState(MessageState.SENDING);
  };

  const { fetchData } = useApi();

  const onSendAiMessage = () => {
    if (draftMessage.trim() === "") return;

    const messageToSend = draftMessage.trim();

    // get the message from the endpoint
    // if no token, open a modal popup to get the token and save in local storage
    const responseText = "This is a response from chatgpt";
    const integration = "gemini_1.0";

    setMessageState(MessageState.SENDING);

    console.log("sending message to AI");
    fetchData<ServerResponse<AiChatResponse>>(
      `/gen-ai-service/chat`,
      SERVICE.AI,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          userId: user._id,
          roomId: roomId,
        }),
      }
    )
      .then((res) => {
        console.log("AI response", res);

        if (res.statusCode === 200) {
          const responseText = res.data.reply;
          setMessageState(MessageState.SENDING);
          // socket.emit("chat-message", {
          //   roomId: roomId,
          //   message: responseText,
          //   replyToId: replyToMessage?.messageId,
          // });
          console.log({ aiButtonType });
          let message;
          message = `Q: ${messageToSend}

_________________

**Response from Gemini:**
${responseText}`;

          if (aiButtonType === AiAssistButtonType.GEN_HINTS) {
            message = `**Sure! Here are the hints to the question:**
            _________________
            ${responseText}`;
          } else if (aiButtonType === AiAssistButtonType.GEN_SOLUTION) {
            message = `**Sure! Here is the solution to the question:**
            _________________
            ${responseText}`;
          } else if (aiButtonType === AiAssistButtonType.CODE_EXPLANATION) {
            message = `**Sure! Here is the explanation of your current code:**
            _________________
            ${responseText}`;
          } else if (aiButtonType === AiAssistButtonType.QUESTION_EXPLANATION) {
            message = `**Sure! Here is the explanation of the question:**
            _________________
            ${responseText}`;
          }

          socket.emit("chat-message", {
            roomId: roomId,
            message: message,
            replyToId: replyToMessage?.messageId,
            integration: integration,
          });
        } else {
          const errorMessage = res.message || "Error chatting with AI";
          handleIntegrationError(integration, errorMessage);

          // Emit error message to the chat widget
          // Adding a slight delay before emitting the error message
          setTimeout(() => {
            socket.emit("chat-message", {
              roomId: roomId,
              message: `⚠️ ${errorMessage}`,
              replyToId: replyToMessage?.messageId,
              integration: integration,
            });
          }, 1500);
        }
      })
      .catch((e) => {
        console.log("Error chatting with AI", e);
        const errorMessage =
          "Error chatting with AI. Please enter your API key and try again.";
        handleIntegrationError(integration, errorMessage);

        // Adding a slight delay before emitting the error message
        setTimeout(() => {
          socket.emit("chat-message", {
            roomId: roomId,
            message: `⚠️ ${errorMessage}`,
            replyToId: replyToMessage?.messageId,
            integration: integration,
          });
        }, 1500);

        notifications.show({
          title: "Error chatting with AI",
          message: errorMessage,
          color: "red",
        });

        setHasApiKey(false);
        deleteApiKey({ roomId, user });
        // openSendApiKeyModal({ roomId, user });
      });
  };

  const handleIntegrationError = (
    integrationId: string,
    errorMessage: string
  ) => {
    setIntegrationErrorState((prevErrors) => ({
      ...prevErrors,
      [integrationId]: { error: errorMessage },
    }));
  };

  const onViewReply = (msg: Message) => {
    // find the reply
    const reply = messages.find((m) => m.messageId === msg.replyToId);
    setSelectedMessage(reply);

    // eh...
    document.getElementById(reply.messageId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // register events when component is mounted, even though they're not active yet
  useEffect(() => {
    function onConnected() {
      console.log(`INFO: socket connected with id ${socket.id}!`);

      setChatState(ChatState.CONNECTED);
      setConnectTries(0);
      setSocketUserId(socket.id);

      onJoinRoom();
    }
    function onDisconnected() {
      console.log("INFO: socket disconnected!");

      setChatState(ChatState.DISCONNECTED);
      resetState();
      setUsersInRoom([]);
    }

    function onMessageSent() {
      console.log("INFO: Message received by server");

      setMessageState(MessageState.BEFORE_SEND);
      setDraftMessage("");
      // setReplyToMessage(null);
      resetState();
    }

    function onReceivedChatMessage(msg: Message) {
      console.log(`INFO: Received message`, msg);

      clearSendTimeout();

      // note: for normal operations, we only send over the NEW message from BE
      setMessages((prev) => [...prev, msg]);

      // if we are at the bottom, set read messages to be messages too
    }

    function onUserJoinedChat(evt: ChatRoomEnterExitEvent) {
      console.log(`INFO: User { ${evt.userSocketId} } joined the chat `);
    }

    function onUserLeftChat(evt: ChatRoomEnterExitEvent) {
      console.log(`INFO: User { ${evt.userSocketId} } left the chat`);
    }

    function onRoomPeopleUpdate(evt: ChatRoomUpdateEvent) {
      console.log("INFO: Room now has: ", evt.users);

      setUsersInRoom(evt.users);
      // add to users seen so far if not already
      evt.users.forEach((user) => {
        if (!usersSeenSoFar.find((u) => u.userId === user.userId)) {
          setUsersSeenSoFar((prev) => [...prev, user]);
        }
      });
    }

    // this function gets called whenever a room is joined
    // will reset all messagse
    function onReceiveChatHistory({ chatHistory }: { chatHistory: Message[] }) {
      console.log("INFO: Received chat history", chatHistory);
      setMessages(chatHistory);
    }

    function onRoomFull() {
      notifications.show({
        title: "Room is full",
        message: "This room is full, please try again later",
        color: "red",
      });

      socket.disconnect();
    }

    socket.on("connect", onConnected);
    socket.on("disconnect", onDisconnected);
    socket.on("message-sent", onMessageSent); // for ack
    socket.on("chat-message", onReceivedChatMessage);
    socket.on("user-joined", onUserJoinedChat); // unused
    socket.on("room-people-update", onRoomPeopleUpdate);
    socket.on("chat-history", onReceiveChatHistory);
    socket.on("room-full", onRoomFull);

    return () => {
      socket.disconnect();
      socket.off("connect", onConnected);
      socket.off("disconnect", onDisconnected);
      socket.off("message-sent", onMessageSent);
      socket.off("chat-message", onReceivedChatMessage);
      socket.off("user-joined", onUserJoinedChat);
      socket.off("room-people-update", onRoomPeopleUpdate);
      socket.off("chat-history", onReceiveChatHistory);
      socket.off("room-full", onRoomFull);
    };
  }, [roomId]);

  const { ref, inViewport } = useInViewport();

  // when we've scrolled to bottom, mark all messages as read
  useEffect(() => {
    if (inViewport) {
      setUnreadMessages(0);
    }
  }, [inViewport]);

  useEffect(() => {
    // if chat is at the bottom scroll, scroll down
    if (
      inViewport ||
      messages[messages.length - 1]?.sender.userId === user._id
    ) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      // setReadMessages(messages.length);
    } else {
      if (messages.length > 0) {
        // this code is prone to break
        setUnreadMessages((prev) => prev + 1);
      }
    }
  }, [messages.length]);
  const otherUser = usersSeenSoFar.find((u) => u.userId !== user._id);

  const [renderVideo, setRenderVideo] = useState(true);
  function onVideoCallDisconnect() {
    setRenderVideo(false);
    setTimeout(() => {
      setRenderVideo(true);
    }, 100);
  }

  // Helper function to simulate a click
  const simulateClick = () => {
    const event = new MouseEvent("click", { bubbles: true });
    const sendButton = document.getElementById("sendButtonId");
    console.log("sendButton", sendButton);
    if (sendButton) {
      sendButton.dispatchEvent(event);
    }
  };

  function handleGenerateHints() {
    const prompt =
      `Can you generate helpful hints for the following coding question?\n\n"${question}"\n\n` +
      `Please provide 3-4 hints that guide the user towards solving the problem without giving away the full solution. ` +
      `Keep the hints concise and focused on the key concepts needed to solve the problem.`;
    setDraftMessage(prompt);
    setIsAiChat(false);
    setAiButtonType(AiAssistButtonType.GEN_HINTS);

    // onBeforeSendMessage();
  }

  function handleGenerateSolution() {
    const prompt =
      `I have attempted a solution for this coding question:\n\n"${question}"\n\n` +
      `Here is my current code:\n\n"${solutionCode}"\n\n` +
      `Can you generate a correct solution for this problem and briefly explain how it differs from my attempt? ` +
      `Please highlight the key changes made to fix any bugs/issues in my original code, while keeping your explanation concise but informative.`;
    setDraftMessage(prompt);
    setIsAiChat(false);
    setAiButtonType(AiAssistButtonType.GEN_SOLUTION);
    // onBeforeSendMessage();
  }

  function handleExplainCode() {
    const prompt =
      `I have written the following solution:\n\n"${solutionCode}"\n\n` +
      `Can you explain this code step by step, focusing on what each part is doing? ` +
      `Highlight any potential issues, bugs, or areas for improvement. ` +
      `Keep the explanation concise but include important details to help me understand the logic behind my implementation. ` +
      `Also, suggest any best practices or optimizations for better performance or readability, if applicable.`;
    setDraftMessage(prompt);
    setIsAiChat(false);
    setAiButtonType(AiAssistButtonType.CODE_EXPLANATION);
    // onBeforeSendMessage();
  }

  function handleExplainQuestion() {
    const prompt =
      `I am having trouble understanding the following LeetCode question:\n\n"${question}"\n\n` +
      `Could you provide an explanation of what this question is asking for, including any hidden details, assumptions, or common pitfalls? ` +
      `Keep the explanation concise but make sure all key details are covered to help me fully understand what is being asked.`;
    setDraftMessage(prompt);
    setIsAiChat(false);
    setAiButtonType(AiAssistButtonType.QUESTION_EXPLANATION);
    // onBeforeSendMessage();
  }

  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  // const { x, y } = useMouse();
  // const [preferredWidth, setPreferredWidth] = useLocalStorage<number>({
  //   key: "preferredWidth",
  // });
  // const [preferredWidth, setPreferredWidth] = useState(0);
  // const [isResizingChatE, setIsResizingChatE] = useState(false);
  // const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  //   setIsResizingChatE(true);
  // };

  // const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  //   if (isResizingChatE) {
  //     // formula: mouseX / windowWidth * 100 - 4 rem (4 rem is 64px)
  //     const newWidth =
  //       (x / window.innerWidth) * 100 - (64 / window.innerWidth) * 100;
  //     setPreferredWidth(newWidth);
  //   }
  // };

  // const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  //   setIsResizingChatE(false);
  // };

  return (
    <Box className={classes.container}>
      <Box
        className={`${classes.chatContainer} ${
          isChatFullscreen && isChatOpen && classes.fullScreen
        }`}
        // style={{
        //   width: preferredWidth === 0 ? "inherit" : `calc(${preferredWidth}vw)`,
        // }}
      >
        <Flex
          className={classes.chatHeader}
          onClick={() => setIsChatOpen((prev) => !prev)}
        >
          <Text size="lg" fw="600">
            {" "}
            Chat
            {/* ({`${messages.length - readMessages}`} unread){" "} */}
          </Text>

          <Space flex={1} />
          {unreadMessages > 0 && (
            <Badge variant="filled" color="orange" radius="xs">
              {" "}
              {`${unreadMessages}`} unread
            </Badge>
          )}
          <Center id="video-call-incoming"></Center>
          {usersInRoom.length > 1 && !isChatOpen && (
            <Box>
              <Indicator
                color="green"
                size={7}
                position="bottom-end"
                offset={3}
                withBorder
                styles={{
                  indicator: {
                    borderWidth: "1px",
                  },
                }}
              >
                <Avatar
                  src={""}
                  radius="xl"
                  name={otherUser?.name}
                  color={"white"}
                  size={"sm"}
                  autoContrast={false}
                />
              </Indicator>
            </Box>
          )}
          <Group>
            {isChatOpen &&
              (isChatFullscreen ? (
                <Tooltip label="Compact the chat window">
                  <ActionIcon
                    variant="transparent"
                    color="initials"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsChatFullscreen(false);
                    }}
                  >
                    <IconArrowsMinimize
                      width="1.25rem"
                      className={`${classes.icon}`}
                    />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Tooltip label="Maximize the chat window">
                  <ActionIcon
                    variant="transparent"
                    color="initials"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsChatFullscreen(true);
                    }}
                  >
                    <IconArrowsMaximize
                      width="1.25rem"
                      className={`${classes.icon}`}
                    />
                  </ActionIcon>
                </Tooltip>
              ))}
            <ActionIcon variant="transparent" color="initials">
              <IconCaretUpFilled
                width="1.25rem"
                className={`${classes.icon} ${isChatOpen && classes.open}`}
              />
            </ActionIcon>
          </Group>
        </Flex>

        <Collapse in={isChatOpen} className={classes.collapse}>
          <Group className={classes.chatContentColored}>
            {usersInRoom.length > 1 ? (
              <Indicator
                color="green"
                size={9}
                position="bottom-end"
                offset={5}
                withBorder
                styles={{
                  indicator: {
                    borderWidth: "1px",
                  },
                }}
              >
                <Avatar
                  src={""}
                  radius="xl"
                  name={otherUser?.name}
                  color={"white"}
                  size={"md"}
                  autoContrast={false}
                />
              </Indicator>
            ) : (
              <Indicator
                color="gray"
                size={9}
                position="bottom-end"
                offset={5}
                withBorder
                styles={{
                  indicator: {
                    borderWidth: "1px",
                  },
                }}
              >
                <Avatar
                  src={""}
                  radius="xl"
                  name={""}
                  color={"white"}
                  size={"md"}
                  autoContrast={false}
                />
              </Indicator>
            )}

            <Text style={{ color: "white" }}>
              {usersInRoom.length < 2
                ? "Waiting for other users to join..."
                : otherUser?.name}
            </Text>
            <Space flex={1} />
            {renderVideo && (
              <VideoChatWidget
                onVideoCallDisconnect={onVideoCallDisconnect}
                otherUser={otherUser}
                roomId={roomId}
              />
            )}
            <ActionIcon
              variant="subtle"
              color="white"
              onClick={() => setShowIntegrations((prev) => !prev)}
            >
              {showIntegrations ? (
                <Tooltip label="Hide messages from integrations e.g. Gemini">
                  <IconEyeOff size="20px" />
                </Tooltip>
              ) : (
                <Tooltip label="Show messages from integrations">
                  <IconEye size="20px" />
                </Tooltip>
              )}
            </ActionIcon>
          </Group>
          <Box className={classes.chatContents} ref={chatContentRef}>
            {messages.map((msg, i) => (
              <TextMessage
                key={i}
                onMessageClicked={onMessageClicked}
                messages={messages}
                msg={msg}
                onViewReply={onViewReply}
                selectedMessage={selectedMessage}
                user={user}
                otherUser={otherUser}
                showIntegrations={showIntegrations}
              />
            ))}
            <div ref={chatEndRef}></div>
            <div ref={ref}></div>
          </Box>
          <Box className={classes.chatFooter}>
            {chatState === ChatState.CONNECTED ? (
              <>
                {defaultSendTo === "gemini_1.0" && (
                  <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                    <Button
                      variant="gradient"
                      gradient={{ from: "violet", to: "blue", deg: 135 }}
                      onClick={handleGenerateHints}
                      loading={
                        messageState === MessageState.SENDING
                        // &&
                        // aiButtonType === AiAssistButtonType.GEN_HINTS
                      }
                      disabled={
                        messageState === MessageState.SENDING &&
                        aiButtonType !== AiAssistButtonType.GEN_HINTS
                      }
                      style={{
                        marginLeft: "1rem",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      Generate Hints
                    </Button>

                    <Button
                      variant="gradient"
                      gradient={{ from: "violet", to: "blue", deg: 135 }}
                      onClick={handleGenerateSolution}
                      loading={
                        messageState === MessageState.SENDING
                        // &&
                        // aiButtonType === AiAssistButtonType.GEN_SOLUTION
                      }
                      disabled={
                        messageState === MessageState.SENDING &&
                        aiButtonType !== AiAssistButtonType.GEN_SOLUTION
                      }
                      style={{
                        marginLeft: "1rem",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      Generate Solution
                    </Button>
                    <Button
                      variant="gradient"
                      gradient={{ from: "violet", to: "blue", deg: 135 }}
                      onClick={handleExplainCode}
                      loading={
                        messageState === MessageState.SENDING
                        // &&
                        // aiButtonType === AiAssistButtonType.CODE_EXPLANATION
                      }
                      disabled={
                        messageState === MessageState.SENDING &&
                        aiButtonType !== AiAssistButtonType.CODE_EXPLANATION
                      }
                      style={{
                        marginLeft: "1rem",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      Explain Code
                    </Button>
                    <Button
                      variant="gradient"
                      gradient={{ from: "violet", to: "blue", deg: 135 }}
                      onClick={handleExplainQuestion}
                      loading={
                        messageState === MessageState.SENDING
                        // &&
                        // aiButtonType === AiAssistButtonType.QUESTION_EXPLANATION
                      }
                      disabled={
                        messageState === MessageState.SENDING &&
                        aiButtonType !== AiAssistButtonType.QUESTION_EXPLANATION
                      }
                      style={{
                        marginLeft: "1rem",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      Explain Question
                    </Button>
                  </div>
                )}
                <Flex className={classes.chatInput}>
                  <Textarea
                    ref={inputRef}
                    value={draftMessage}
                    onChange={(e) => {
                      if (messageState === MessageState.SENDING) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                      }
                      setDraftMessage(e.target.value);
                    }}
                    placeholder="Type a message... (CTRL+ENTER) to send"
                    w={"100%"}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && event.ctrlKey) {
                        // onSendMessage();
                        // add newlinw
                        if (defaultSendTo === "gemini_1.0") {
                          setIsAiChat(true);
                        }
                        onBeforeSendMessage();
                      } else if (event.key === "Enter") {
                        event.stopPropagation();
                        // onSendMessage();

                        // setDraftMessage((prev) => prev + "\n");
                      }
                    }}
                    autosize={isChatFullscreen}
                    maxRows={7}
                    minRows={3}
                    // disabled={messageState === MessageState.SENDING}
                  />
                  <Menu
                    shadow="md"
                    width={300}
                    opened={isSendToMenuOpen}
                    onChange={setIsSendToMenuOpen}
                  >
                    <Radio.Group
                      value={defaultSendTo}
                      // NOTE: The values in all Radio MUST be one of the values of the type
                      // @ts-ignore
                      onChange={setDefaultSendTo}
                      name="defaultSendTo"
                      // label="Select your favorite framework/library"
                      // description="This is anonymous"
                      // withAsterisk
                    >
                      <Box
                        style={{
                          position: "relative",
                        }}
                      >
                        <Menu.Target>
                          <div
                            style={{
                              position: "absolute",
                              top: "0",
                              right: "0",
                              width: "100%",
                              bottom: "0",
                            }}
                          ></div>
                        </Menu.Target>
                        <Tooltip
                          label={`Right-click opens additional options for sending messages!`}
                          multiline
                          w={200}
                          position="right"
                        >
                          <ActionIcon
                            variant="subtle"
                            onClick={onSendButtonClick}
                            style={{ padding: "6px" }}
                            size={"lg"}
                            color="gray"
                            loading={messageState === MessageState.SENDING}
                            onContextMenu={onSendButtonClick}
                            id="sendButtonId"
                          >
                            {defaultSendTo === "person" ? (
                              <IconSend2 />
                            ) : (
                              <IconMailAi />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      </Box>
                      <Menu.Dropdown>
                        <Menu.Label>
                          <Group>
                            {" "}
                            <div style={{ flex: 1 }}>
                              Default send target{" "}
                            </div>{" "}
                            <div>
                              {" "}
                              <Kbd>ENTER</Kbd> to send{" "}
                            </div>
                          </Group>
                        </Menu.Label>
                        <Menu.Item
                          leftSection={
                            <Avatar
                              src={""}
                              radius="xl"
                              size={"sm"}
                              name={otherUser?.name}
                              color={"initials"}
                              // size={"md"}
                              // autoContrast={false}
                            />
                          }
                          rightSection={
                            <Group>
                              <Box onClick={(e) => e.stopPropagation()}>
                                <Radio value="person" />
                              </Box>
                            </Group>
                          }
                          // onClick={onSendMessage}
                          onClick={() => {
                            setDefaultSendTo("person");
                            setIsSendToMenuOpen(false);
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            {otherUser?.name || "Other users"}
                          </div>
                        </Menu.Item>

                        {/* <Menu.Divider /> */}
                        <Menu.Item
                          leftSection={
                            <Avatar
                              src={GeminiIcon}
                              radius="xl"
                              name={"Gemini"}
                              // color={"blue"}
                              size={"sm"}
                            />
                          }
                          rightSection={
                            <Box onClick={(e) => e.stopPropagation()}>
                              <Radio value="gemini_1.0" />
                            </Box>
                          }
                          // onClick={onSendAiMessage}
                          onClick={() => {
                            setDefaultSendTo("gemini_1.0");
                            setIsSendToMenuOpen(false);
                          }}
                        >
                          <Group
                            style={{
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            Google Gemini{" "}
                            <Badge
                              // size="xl"
                              variant="gradient"
                              gradient={{
                                from: "violet",
                                to: "blue",
                                deg: 135,
                              }}
                              radius={"xs"}
                              style={{ cursor: "pointer" }}
                            >
                              AI
                            </Badge>
                          </Group>
                        </Menu.Item>
                        {/* <Menu.Item
                        leftSection={
                          <IconMessageCircle
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        }
                      >
                        Messages
                      </Menu.Item>
                      <Menu.Item
                        leftSection={
                          <IconPhoto
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        }
                      >
                        Gallery
                      </Menu.Item>
                      <Menu.Item
                        leftSection={
                          <IconSearch
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        }
                        rightSection={
                          <Text size="xs" c="dimmed">
                            ⌘K
                          </Text>
                        }
                      >
                        Search
                      </Menu.Item> */}

                        {/* <Menu.Divider /> */}

                        {/* <Menu.Label>Danger zone</Menu.Label>
                      <Menu.Item
                        leftSection={
                          <IconArrowsLeftRight
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        }
                      >
                        Transfer my data
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={
                          <IconTrash
                            style={{ width: rem(14), height: rem(14) }}
                          />
                        }
                      >
                        Delete my account
                      </Menu.Item> */}
                      </Menu.Dropdown>
                    </Radio.Group>
                  </Menu>

                  <Box className={classes.additions}>
                    {unreadMessages > 0 && (
                      <Flex
                        className={classes.unread}
                        onClick={() => {
                          chatEndRef.current?.scrollIntoView({
                            behavior: "smooth",
                          });

                          setUnreadMessages(0);
                        }}
                      >
                        <IconArrowNarrowDown size="12px" />
                        <Text style={{ grow: 1, fontSize: "0.8rem" }}>
                          {" "}
                          {unreadMessages} new messages{" "}
                        </Text>
                        <IconArrowNarrowDown size="12px" />
                      </Flex>
                    )}

                    {replyToMessage && (
                      <Flex className={classes.replyTo}>
                        {" "}
                        <Center>
                          <IconCornerUpRight
                            size="12px"
                            style={{ flexShrink: 0 }}
                          />
                        </Center>
                        <Text className={classes.replyToText} truncate="end">
                          Replying to{" "}
                          <span style={{ fontWeight: "800" }}>
                            {replyToMessage.content}
                          </span>
                        </Text>
                        <Space flex={1} />
                        <ActionIcon
                          variant="transparent"
                          onClick={() => onMessageClicked(null)}
                          color={`${colorScheme === "dark" ? "white" : "cyan"}`}
                        >
                          {/* cancel */}
                          <IconX size="16px" />
                        </ActionIcon>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              </>
            ) : (
              <Center style={{ width: "100%", padding: "1rem" }}>
                <Button
                  onClick={onConnectToChat}
                  fullWidth
                  variant="light"
                  style={{ maxWidth: "500px" }}
                  loading={chatState === ChatState.CONNECTING}
                >
                  Connect to chat
                </Button>
              </Center>
            )}
          </Box>

          {/* <div
            className={classes.resizeHandlerE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          ></div> */}
        </Collapse>
        <div id="video-chat-widget"> </div>
      </Box>
    </Box>
  );
}

type TextMessageProps = {
  msg: Message;
  onMessageClicked: (msg: Message) => void;
  selectedMessage: Message | null;
  user: User;
  onViewReply: (msg: Message) => void;
  messages: Message[];
  otherUser?: ChatRoomUser;
  showIntegrations: boolean;
};
function TextMessage({
  msg,
  onMessageClicked,
  selectedMessage,
  user,
  onViewReply,
  messages,
  otherUser,
  showIntegrations,
}: TextMessageProps) {
  function getAvatar(integration: string) {
    if (integration === "gemini_1.0") {
      return (
        <Avatar
          src={GeminiIcon}
          radius="xl"
          name={"Gemini"}
          color={"blue"}
          size={"md"}
        />
      );
    } else {
      return (
        <Avatar
          src={""}
          radius="xl"
          name={otherUser?.name}
          color={"cyan"}
          size={"md"}
        />
      );
    }
  }
  console.log({ msg });

  const textObjects = generateReactObjects(msg.content);
  return (
    <Box
      id={msg.messageId}
      onClick={() => onMessageClicked(msg)}
      className={`${classes.canSelect} ${
        selectedMessage?.messageId === msg.messageId ? classes.isSelected : ""
      }`}
    >
      {msg.sender.userId !== user._id || msg.integration ? (
        <Box
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexDirection: "column",
          }}
          display={
            showIntegrations ? "flex" : msg.integration ? "none" : "flex"
          }
        >
          {msg.replyToId && (
            <Flex>
              <Text
                size="xs"
                className={classes.replyToText}
                style={{ marginLeft: "2rem" }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onViewReply(msg);
                }}
              >
                <Flex style={{ flexShrink: 0, gap: "8px" }}>
                  <IconCurrencyLeu
                    size="14px"
                    style={{
                      transform: "scale(1, -1) translateY(-50%)",
                    }}
                  />{" "}
                  replied to{" "}
                </Flex>
                <span
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    // clamp to 1 line
                    whiteSpace: "nowrap",
                  }}
                >
                  {
                    messages.find(
                      (otherMsg) => otherMsg.messageId === msg.replyToId
                    )?.content
                  }
                </span>
                <Flex style={{ flexShrink: 0, gap: "8px" }}>
                  <IconCornerRightUp size="14px" />
                </Flex>
              </Text>
            </Flex>
          )}
          <Box
            className={`${classes.entry} ${classes.receive} ${
              msg.integration && classes.integration
            }`}
          >
            {/* <Avatar
              src={""}
              radius="xl"
              name={otherUser?.name}
              color={"cyan"}
              size={"md"}
            /> */}
            {getAvatar(msg.integration)}
            <Box className={`${classes.textBox}`}>
              {" "}
              <Box style={{ overflow: "hidden" }}>{textObjects}</Box>
              <span className={`${classes.timestamp}`}>
                {formatTime(new Date(msg.timestamp))}{" "}
              </span>{" "}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexDirection: "column",
          }}
        >
          {msg.replyToId && (
            <Flex>
              <Text
                size="xs"
                className={classes.replyToText}
                style={{ marginLeft: "auto" }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onViewReply(msg);
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    gap: "8px",
                    display: "flex",
                  }}
                >
                  <IconCornerLeftUp size="14px" /> replied to{" "}
                </span>
                <span
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {
                    messages.find(
                      (otherMsg) => otherMsg.messageId === msg.replyToId
                    )?.content
                  }
                </span>
                <Flex style={{ flexShrink: 0, gap: "8px" }}>
                  <IconCurrencyLeu
                    size="14px"
                    style={{
                      transform: "rotate(180deg) translateY(-50%)",
                    }}
                  />
                </Flex>
              </Text>
            </Flex>
          )}
          <Box className={`${classes.entry} ${classes.send}`}>
            {/* <Text className={`${classes.textBox}`}> {msg.content} </Text> */}
            <Box className={classes.textBox}>
              <Box style={{ overflow: "hidden" }}>{textObjects}</Box>
            </Box>
            <Text
              className={`${classes.timestamp}`}
              onClick={() => console.log(msg)}
              size="xs"
            >
              {formatTime(new Date(msg.timestamp))}{" "}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
