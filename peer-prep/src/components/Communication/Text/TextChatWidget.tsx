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
  Collapse,
  Flex,
  Group,
  Input,
  Menu,
  Radio,
  rem,
  Space,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";

import classes from "./TextChatWidget.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { socket } from "../../../websockets/communication/socket";
import {
  IconAi,
  IconArrowDown,
  IconArrowNarrowDown,
  IconArrowsLeftRight,
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
import { useInViewport, useTimeout } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { formatTime } from "../../../utils/utils";
import VideoChatWidget from "../Video/VideoChatWidget";
import { User } from "../../../types/user";

import GeminiIcon from "../../../assets/integrations/google-gemini-icon.svg";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";

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

export default function TextChatWidget({ roomId }: TextChatWidgetProps) {
  const { user } = useAuth();

  const [messageState, setMessageState] = useState<MessageState>(
    MessageState.BEFORE_SEND
  );
  const wasFocusedOnInput = useRef(false);

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

  const [integrationErrorState, setIntegrationErrorState] =
    useState<IntegrationError>({});

  const chatContentRef = useRef<HTMLDivElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // useEffect(() => {
  //   if (
  //     wasFocusedOnInput.current &&
  //     messageState === MessageState.BEFORE_SEND
  //   ) {
  //     // re-focus on the input
  //     inputRef.current?.focus();
  //   }
  // }, [messageState, inputRef.current]);

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

    socket.emit("joinRoom", {
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
      onSendAiMessage();
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

    try {
      fetchData<ServerResponse<AiChatResponse>>(
        `/ai-chat-service/chat`,
        SERVICE.AI,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageToSend,
          }),
        }
      ).then((res) => {
        console.log("AI response", res);

        if (res.statusCode === 200) {
          const responseText = res.data.reply;
          setMessageState(MessageState.SENDING);
          // socket.emit("chat-message", {
          //   roomId: roomId,
          //   message: responseText,
          //   replyToId: replyToMessage?.messageId,
          // });

          socket.emit("chat-message", {
            roomId: roomId,
            message: `${messageToSend}\n--------------\n${responseText}`,
            replyToId: replyToMessage?.messageId,
            integration: integration,
          });
        } else {
          const errorMessage = res.message || "Error chatting with AI";
          handleIntegrationError(integration, errorMessage);
        }
      });
    } catch (e) {
      const errorMessage =
        "Error sending message. Please check your internet connection.";
      handleIntegrationError(integration, errorMessage);

      notifications.show({
        title: "Error chatting with AI",
        message: errorMessage,
        color: "red",
      });
    }
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

  return (
    <Box className={classes.container}>
      <Box className={classes.chatContainer}>
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
          <Group>
            <ActionIcon variant="transparent" color="initials">
              <IconCaretUpFilled
                width="1.25rem"
                className={`${classes.icon} ${isChatOpen && classes.open}`}
              />
            </ActionIcon>
          </Group>
        </Flex>

        <Collapse in={isChatOpen}>
          <Group className={classes.chatContentColored}>
            <Avatar
              src={""}
              radius="xl"
              name={otherUser?.name}
              color={"white"}
              size={"md"}
              autoContrast={false}
            />
            <Text style={{ color: "white" }}>
              {usersInRoom.length < 2
                ? "Waiting for other users to join..."
                : otherUser?.name}
            </Text>
            <Space flex={1} />
            {renderVideo && (
              <VideoChatWidget
                roomId={roomId}
                onVideoCallDisconnect={onVideoCallDisconnect}
                otherUser={otherUser}
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
                  placeholder="Type a message... (ENTER) to send"
                  w={"100%"}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.ctrlKey) {
                      // onSendMessage();
                      // add newlinw
                      setDraftMessage((prev) => prev + "\n");
                    } else if (event.key === "Enter") {
                      event.stopPropagation();
                      // onSendMessage();
                      onBeforeSendMessage();
                    }
                  }}

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
                      <ActionIcon
                        variant="subtle"
                        onClick={onSendButtonClick}
                        style={{ padding: "6px" }}
                        size={"lg"}
                        color="gray"
                        loading={messageState === MessageState.SENDING}
                        onContextMenu={onSendButtonClick}
                      >
                        {defaultSendTo === "person" ? (
                          <IconSend2 />
                        ) : (
                          <IconMailAi />
                        )}
                      </ActionIcon>
                    </Box>
                    <Menu.Dropdown>
                      <Menu.Label>
                        <Group>
                          {" "}
                          <div style={{ flex: 1 }}>Send to </div>{" "}
                          <div> Default </div>
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
                        onClick={onSendMessage}
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
                        onClick={onSendAiMessage}
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
                            gradient={{ from: "violet", to: "blue", deg: 135 }}
                            radius={"xs"}
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
                      >
                        {/* cancel */}
                        <IconX size="16px" />
                      </ActionIcon>
                    </Flex>
                  )}
                </Box>
              </Flex>
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
            <Text className={`${classes.textBox}`}>
              {" "}
              {msg.content}{" "}
              <span className={`${classes.timestamp}`}>
                {formatTime(new Date(msg.timestamp))}{" "}
              </span>{" "}
            </Text>
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
            <Text className={`${classes.textBox}`}> {msg.content} </Text>
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
