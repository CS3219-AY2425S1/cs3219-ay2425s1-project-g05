import {
  Accordion,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Input,
  Loader,
  Modal,
  Paper,
  PasswordInput,
  Rating,
  ScrollArea,
  SimpleGrid,
  Space,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
  useMantineColorScheme,
} from "@mantine/core";
import classes from "./SessionPage.module.css";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CodeEditor from "../../../components/CollabCodeEditor/CollabCodeEditor";
import AvatarWithDetailsButton from "../../../components/AvatarIcon/AvatarWithDetailsButton";
import { IconChevronRight } from "@tabler/icons-react";
import { Question, TestCaseResult } from "../../../types/question";
import { useLocalStorage, useSessionStorage, useTimeout } from "@mantine/hooks";
import { modals, ModalsProvider } from "@mantine/modals";
import TextChatWidget from "../../../components/Communication/Text/TextChatWidget";
import { notifications } from "@mantine/notifications";
import TestCasesWrapper from "../../../components/TestCases/TestCasesWrapper";
import { useAuth } from "../../../hooks/useAuth";
import { UserResponseData } from "../../../types/user";

import { TestCaseResult as TestCaseResultDb } from "../../../types/attempts";
import AlertBox from "../../../components/Alert/AlertBox";
import { AIProvider, useAi } from "../../../hooks/useAi";

type QuestionCategory =
  | "ALGORITHMS"
  | "DATABASES"
  | "DATA STRUCTURES"
  | "BRAINTEASER"
  | "STRINGS"
  | "BIT MANIPULATION"
  | "RECURSION";

// Map of category to color for badges
const categoryColorMap: { [key in QuestionCategory]: string } = {
  ALGORITHMS: "blue",
  DATABASES: "green",
  "DATA STRUCTURES": "orange",
  BRAINTEASER: "red",
  STRINGS: "purple",
  "BIT MANIPULATION": "cyan",
  RECURSION: "teal",
};
interface CheckRoomDetailsResponse {
  [roomId: string]: {
    users: String[];
  };
}

const LOCAL_WEBSOCKET = import.meta.env.VITE_COLLAB_WS_URL_LOCAL;

interface HistoryResponse {
  attempt: any;
}

let dummyQuestion: Question = {
  _id: "1",
  title: "",
  categories: [],
  difficulty: "EASY",
  __v: 0,
  categoriesId: [],
  description: {
    descriptionText: "",
    descriptionHtml: "",
  },
  isDeleted: false,
  link: "",
  meta: {},
  solutionCode: "",
  templateCode: "",
  testCases: [],
};

export default function SessionPage() {
  const WEBSOCKET_URL = import.meta.env.VITE_COLLAB_WS_URL || LOCAL_WEBSOCKET;

  const { fetchData } = useApi();
  const navigate = useNavigate();

  const { user } = useAuth();

  const location = useLocation();

  // todo questionReceived shouldnt be fromt location.state
  // roomid is from URL
  const {
    questionReceived,
    roomIdReceived,
    otherUserIdReceived,
  }: {
    questionReceived: Question;
    roomIdReceived: string;
    otherUserIdReceived: string;
  } = location.state || {};
  const question = questionReceived || dummyQuestion;

  const roomId = useParams().roomId;

  const { colorScheme } = useMantineColorScheme();

  // Room ID and Question details from matching of users
  // TODO don't depend on location.state, make request to get question and room details? OR include it in the URL?
  const [otherUserId, setOtherUserId] = useState(otherUserIdReceived);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [otherUserDisplayName, setOtherUserDisplayName] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");

  // Question details to be displayed
  // todo   QuestionCategory[]

  const {
    difficulty: questionDifficulty,
    categories: questionCategories,
    title: questionTitle,
    description: questionDescription,
    link: leetCodeLink,
    templateCode,
  } = question;

  const testCaseWrapperRef = useRef<HTMLDivElement>(null);

  // todo
  // const [attemptCode, setAttemptCode] = useState(question.templateCode);
  const latestResultsRef = useRef<TestCaseResult[]>([]);

  // when true, don't show modal when # users in room < 2
  // const [isWaitingForRejoin, setIsWaitingForRejoin] = useState(false);
  const isWaitingForRejoinRef = useRef(false);

  // don't need to rerender!
  const currentValueRef = useRef("");
  const peopleInRoomFromCollabServiceRef = useRef<number>(0);

  const { start: startRedirectToHome, clear: clearRedirectToHome } = useTimeout(
    () => {
      navigate("/dashboard", {
        replace: true,
      });
    },
    5000
  );

  useEffect(() => {
    // step 1: check if room is deleted
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (peopleInRoomFromCollabServiceRef.current === 1) {
        // show a confirmation dialog, saying that if they leave the page, the session will be destroyed and they cannot come back anymore
        event.preventDefault();

        // for legacy
        event.returnValue = true;
      }
    }
    (async () => {
      try {
        const response = await fetchData<ServerResponse<{ deleted: boolean }>>(
          `/collaboration-service/rooms/status/${roomId}`,
          SERVICE.COLLAB
        );
        if (response.data.deleted) {
          // room is deleted
          // force redirect the user to the home page
          openSessionDestroyedModal();
          startRedirectToHome();

          return;
        }

        console.log("LOG: room not deleted");

        addEventListener("beforeunload", onBeforeUnload);

        fetchData<
          ServerResponse<{
            [roomId: string]: {
              users: string[];
            };
          }>
        >(`/collaboration-service/rooms/${roomId}`, SERVICE.COLLAB)
          .then((res1) => {
            console.log({ res1 });
            console.log("LOG✅: Room details", res1);
            const otherUserId =
              res1.data[roomId].users.find((id) => id !== user?._id) || "";
            setOtherUserId(otherUserId);

            fetchData<
              ServerResponse<{
                channelId: string;
              }>
            >(`/run-service/session`, SERVICE.RUN, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                firstUserId: user?._id,
                secondUserId: otherUserId,
              }),
            })
              .then((response) => {
                console.log(
                  "LOG✅: Session created with CHANNEL ID",
                  response.data.channelId
                );
                setChannelId(response.data.channelId);
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch(console.error);

        fetchData<ServerResponse<UserResponseData>>(
          `/user-service/users/${otherUserId}`,
          SERVICE.USER
        )
          .then((response) => {
            setOtherUserDisplayName(response.data.user.displayName);
            setOtherUserEmail(response.data.user.email);
          })
          .catch((error) => {
            console.error("Error getting details of other user:", error);
            notifications.show({
              message: error.message,
              color: "red",
            });
          });
      } catch (e) {
        console.error("Error checking if room is deleted", e);
        notifications.show({
          message: e.message,
          color: "red",
        });
      }
    })();

    return () => {
      clearRedirectToHome();

      // unregister the event listener
      removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  const renderComplexity = () => {
    const difficultyRating =
      questionDifficulty === "EASY"
        ? 1
        : questionDifficulty === "MEDIUM"
        ? 2
        : 3;
    return (
      <Rating mt="xs" defaultValue={difficultyRating} count={3} readOnly />
    );
  };

  const checkRoomStatus = async () => {
    try {
      const response = await fetchData<
        ServerResponse<CheckRoomDetailsResponse>
      >(`/collaboration-service/rooms/${roomId}`, SERVICE.COLLAB);

      const users = response.data[roomId].users;

      peopleInRoomFromCollabServiceRef.current = users.length;
      if (users.length < 2 && !isWaitingForRejoinRef.current) {
        // other user has left the room
        openSessionEndedModal();
      }
      if (users.length === 2) {
        // other user has joined the room
        if (isWaitingForRejoinRef.current) {
          isWaitingForRejoinRef.current = false;

          // notify that the other user has joined back
          notifications.show({
            title: "User has joined back",
            message:
              "The other user has joined back. You can now continue the session.",
            color: "green",
          });
        }
      }
    } catch (error: any) {
      console.error("Error checking room status", error);
      // notifications.show({
      //   message: error.message,
      //   color: "red",
      // });
    }
  };

  useEffect(() => {
    // Call checkRoomStatus every 5 seconds
    const intervalId = setInterval(() => {
      checkRoomStatus();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const openEndSessionModal = () => {
    console.log("End Session");
    modals.openConfirmModal({
      title: "Would you like to end the session?",
      labels: {
        confirm: "End Session",
        cancel: "Cancel",
      },
      onConfirm: handleEndSession,
    });
  };

  const openSessionDestroyedModal = () => {
    console.log("LOG: Session Destroyed");

    modals.open({
      title: "Session has been destroyed",
      children: (
        <Stack>
          <AlertBox type="error">
            {" "}
            <Stack
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Center>
                <Text
                  style={{
                    textAlign: "center",
                  }}
                >
                  The session has been destroyed as both users had left the
                  room.
                </Text>
              </Center>
              <Center>
                <Text
                  style={{
                    textAlign: "center",
                  }}
                >
                  You will be redirected to the home page in 5 seconds.
                </Text>
              </Center>
            </Stack>
          </AlertBox>

          <Group>
            <Space flex={1} />
            <Button
              variant="filled"
              onClick={() => {
                navigate("/dashboard", {
                  replace: true,
                });
              }}
            >
              Go to home
            </Button>
          </Group>
        </Stack>
      ),

      withCloseButton: false,
      closeOnClickOutside: false,
      closeOnEscape: false,
    });
  };

  const openSessionEndedModal = () => {
    console.log("Session Ended");
    modals.open({
      title: "Session has ended",
      children: (
        <>
          <Text>
            This session has ended as the other user has left the room.
          </Text>
          <Text mt="lg">
            You can choose to wait for the other user to join back, or end the
            session. If you choose to wait, do note that if you refresh the
            page, your progress may be lost.
          </Text>
          <Text mt="sm">
            You'll be notified when the other user joins back.
          </Text>
          <SimpleGrid cols={2} mt={"lg"}>
            <Button fullWidth variant="light" onClick={handleWait}>
              Wait for the other user
            </Button>
            <Button
              fullWidth
              onClick={handleEndSession}
              variant="light"
              color="red"
            >
              End session
            </Button>
          </SimpleGrid>
        </>
      ),
      withCloseButton: false,
      size: "lg",
      closeOnClickOutside: false,
      closeOnEscape: false,
    });
  };

  const {
    isApiKeyModalVisible,
    setApiKeyModalVisible,
    hasApiKey,
    setHasApiKey,
    openSendApiKeyModal,
    deleteApiKey,
  } = useAi();

  // Check if user has already sent their API key
  useEffect(() => {
    fetchData<ServerResponse<{ hasActiveSession: boolean }>>(
      `/gen-ai-service/check-active-session`,
      SERVICE.AI,
      {
        method: "POST",
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
        console.log("LOG: hasActiveSession = ", response.data.hasActiveSession);
        if (response.data.hasActiveSession) {
          setHasApiKey(true);
        }
      })
      .catch((error: any) => {
        console.error("Error checking active session", error);
      });
  }, []);

  const handleEndSession = async (e?) => {
    e?.stopPropagation();
    // call history service to create an attempt
    try {
      const {
        _id,
        testCases,
        meta,
        templateCode,
        isDeleted,
        __v,
        categories,
        ...questionForAttempt
      } = question;

      console.log(currentValueRef);
      console.log("LOG: latestResults = ", {
        latestResultsRef: latestResultsRef.current,
      });

      if (!latestResultsRef.current.length) {
        // notifications.show({
        //   title: "No test cases run",
        //   message: "Please run the test cases before ending the session.",
        //   color: "red",
        // });
        // run test caess
        // @ts-ignore
        testCaseWrapperRef.current.runTestCases();

        modals.open({
          withCloseButton: false,
          closeOnClickOutside: false,
          closeOnEscape: false,
          title: "Running test cases...",
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
                Running test cases...{" "}
              </Title>
              <Text style={{ textAlign: "center" }}>
                {" "}
                You will be redirected to the Session page automatically when
                all test cases have finished running.{" "}
              </Text>
            </Flex>
          ),
        });
      }
      while (latestResultsRef.current.length === 0) {
        console.log("WAITING FOR RESULTS");
        await sleep(500);
      }
      modals.closeAll();

      console.log("LOG: latestResults = ", latestResultsRef.current);
      const results: TestCaseResultDb[] = latestResultsRef.current.map(
        (result) => {
          return {
            testCaseId: result.testCaseDetails.testCaseId,
            expectedOutput: result.testCaseDetails.expectedOutput || " ",
            input: result.testCaseDetails.input,
            isPassed: result.isPassed,
            output: result.stdout || " ",
            error: result.stderr || " ",
            meta: {
              memory: result.memory,
              time: result.time,
            },
          };
        }
      );

      const response = await fetchData<ServerResponse<HistoryResponse>>(
        `/history-service/attempt`,
        SERVICE.HISTORY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otherUserId,
            roomId,
            notes: " ",
            attemptCode: currentValueRef.current,
            testCaseResults:
              // dummyTestCaseResults,
              results,
            question: questionForAttempt,
          }),
        }
      );
      console.log("Attempt created", response);

      // "end" the session
      fetchData(
        `/collaboration-service/rooms/status/${roomId}`,
        SERVICE.COLLAB,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).catch(console.warn);

      const attempt = response.data.attempt;
      console.log("Attempt", attempt);

      // delete the AI session
      if (hasApiKey) {
        deleteApiKey({ roomId, user });
      }
      // navigate to session summary page
      navigate(`/session/summary/${roomId}`, {
        state: { roomIdReceived: roomId, attemptReceived: attempt },
        replace: true,
      });
    } catch (error: any) {
      console.error("Error ending session", error);
      notifications.show({
        title: "Error ending session",
        message: error.message,
        color: "red",
      });
    } finally {
      // modals.closeAll();
    }
  };

  const handleWait = () => {
    console.log("LOG: we're waiting");
    // just close the modal
    modals.closeAll();
    isWaitingForRejoinRef.current = true;
  };

  return (
    <ModalsProvider>
      <TextChatWidget
        roomId={roomId}
        question={question.description.descriptionHtml}
        solutionCode={currentValueRef.current}
      />
      <Box className={classes.wrapper}>
        {/* Collaborator Details */}
        <Group mb="md" style={{ alignItems: "center" }}>
          <Group>
            <Avatar radius="xl" size="md" color="blue">
              {otherUserDisplayName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text size="sm">{otherUserDisplayName}</Text>
              <Text size="xs" color="dimmed">
                {otherUserEmail}
              </Text>
            </div>
            <Badge color="teal" size="sm" variant="filled" ml="xs">
              Collaborator
            </Badge>
          </Group>
          <IconChevronRight size="1rem" color="dimmed" />
        </Group>

        <Flex gap="md" className={classes.mainContent}>
          <Paper
            radius="md"
            withBorder
            style={{
              // flex: 1,
              minHeight: "100%",
              width: "50%",
              overflow: "auto",
            }}
            className={classes.paper}
          >
            <Title
              order={3}
              style={{ fontSize: "1.5rem", marginRight: "1rem" }}
            >
              {questionTitle}
            </Title>
            <Group mt={8}>
              {questionCategories.map((category, index) => (
                <Badge
                  key={index}
                  color={categoryColorMap[category] || "cyan"}
                  size="sm"
                  variant="filled"
                >
                  {category}
                </Badge>
              ))}
            </Group>
            {renderComplexity()}

            <ScrollArea type="hover" h={700} mt={10}>
              <TypographyStylesProvider>
                <div
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: questionDescription.descriptionHtml,
                  }}
                ></div>
              </TypographyStylesProvider>
            </ScrollArea>
            <Button
              variant="light"
              color="blue"
              component="a"
              href={leetCodeLink}
              target="_blank"
              mt="sm"
              size="xs"
            >
              View on LeetCode
            </Button>

            <Center>
              <Button
                // variant="light"
                color="red"
                size="md"
                style={{ marginTop: "1rem" }}
                onClick={openEndSessionModal}
              >
                End Session
              </Button>
            </Center>
          </Paper>

          <Stack style={{ flex: 1, gap: "1 rem" }}>
            <Paper
              radius="md"
              withBorder
              style={{ flex: 1, minHeight: "100%" }}
            >
              <CodeEditor
                // endpoint={"ws://localhost:8004"}
                endpoint={WEBSOCKET_URL}
                room={roomId}
                userId={user._id}
                theme={`vs-${colorScheme}`}
                height={"500px"}
                defaultValue={question.templateCode}
                currentValueRef={currentValueRef}
              />
            </Paper>

            <TestCasesWrapper
              ref={testCaseWrapperRef}
              channelId={channelId}
              currentValueRef={currentValueRef}
              userId={user._id}
              otherUserId={otherUserId}
              latestResultsRef={latestResultsRef}
              roomId={roomId}
              question={question}
            />
          </Stack>
        </Flex>
      </Box>
    </ModalsProvider>
  );
}

// temp sleep function for await
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
