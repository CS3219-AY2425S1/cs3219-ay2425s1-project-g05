import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  ButtonProps,
  Code,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Space,
  Stack,
  Text,
  Textarea,
  Title,
  TypographyStylesProvider,
  useMantineColorScheme,
} from "@mantine/core";
import classes from "./SessionSummaryPage.module.css";
import { useEffect, useState } from "react";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { Question } from "../../../types/question";
import {
  IconCheck,
  IconChevronRight,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconDatabase,
  IconHourglassEmpty,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import CodeEditorWithLanguageSelector from "../../../components/Questions/CodeEditor/CodeEditor";
import {
  AttemptData,
  TestCaseResult,
  UserAttempt,
} from "../../../types/attempts";
import { useLocation } from "react-router-dom";
import { UserResponseData } from "../../../types/user";
import { CodeHighlight } from "@mantine/code-highlight";
import { kBtoMb, secondsToMsIfappropriate } from "../../../utils/utils";

export default function SessionSummaryPage() {
  const { fetchData } = useApi();

  const location = useLocation();
  const { roomIdReceived, attemptReceived } = location.state || {};

  const [roomId, setRoomId] = useState(roomIdReceived);
  const [attempt, setAttempt] = useState<UserAttempt>(attemptReceived);

  // Attempt data to display
  const [completedAt, setCompletedAt] = useState("");
  const [otherUserDisplayName, setOtherUserDisplayName] = useState("");
  const [otherUserEmail, setOtherUserEmail] = useState("");

  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");

  const [notes, setNotes] = useState("");
  const [toSave, setToSave] = useState(false);

  const [userSolution, setUserSolution] = useState("");
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
  const [privateTestsPassed, setPrivateTestsPassed] = useState(true);

  // Retrieve session summary and details of other user on page load
  useEffect(() => {
    getSessionSummary();
    getOtherUser();
  }, []);

  const getSessionSummary = async () => {
    try {
      fetchData<ServerResponse<AttemptData>>(
        `/history-service/attempt/${roomId}`,
        SERVICE.HISTORY
      ).then((response) => {
        getQuestion(response.data.attempt[0].question._id);
        console.log("LOG: Attempt data: ", { data: response.data });
        const attempt = response.data.attempt[0];
        setAttempt(attempt);

        const question = attempt.question as Question;
        setQuestionTitle(question.title);
        setQuestionDescription(question.description.descriptionHtml);

        setCompletedAt(formatDateTime(attempt.createdAt));
        if (attempt.notes !== " ") {
          setNotes(attempt.notes);
        }

        setUserSolution(attempt.attemptCode);

        setTestCaseResults(attempt.testCaseResults);
        setPrivateTestsPassed(
          calculateSummary(attempt.testCaseResults).failed === 0
        );
      });
    } catch (error: any) {
      console.error("Error getting session summary:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const getQuestion = (qnId: string) => {
    fetchData<ServerResponse<Question>>(
      `/question-service/id/${qnId}`,
      SERVICE.QUESTION
    ).then((response) => {
      console.log({ response });
      const question = response.data;
    });
  };

  const getOtherUser = async () => {
    try {
      fetchData<ServerResponse<UserResponseData>>(
        `/user-service/users/${attempt.otherUserId}`,
        SERVICE.USER
      ).then((response) => {
        setOtherUserDisplayName(response.data.user.displayName);
        setOtherUserEmail(response.data.user.email);
      });
    } catch (error: any) {
      console.error("Error getting details of other user:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  // Helper function to calculate passed/failed summary
  const calculateSummary = (results: TestCaseResult[]) => {
    const passed = results.filter((result) => result.isPassed).length;
    return { passed, failed: results.length - passed };
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const { passed, failed } = calculateSummary(testCaseResults);

  const handleSaveNotes = async () => {
    try {
      fetchData<ServerResponse<UserAttempt>>(
        `/history-service/attempt/${roomId}`,
        SERVICE.HISTORY,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes,
          }),
        }
      ).then((response) => {
        setToSave(false);
        notifications.show({
          message: "Notes saved successfully!",
          color: "green",
        });
      });
    } catch (error: any) {
      console.error("Error saving notes:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    "python"
  );

  const [render, setRender] = useState(false);
  useEffect(() => {
    setRender(false);
    setTimeout(() => {
      setRender(true);
    }, 0);
  }, [selectedLanguage]);

  const attemptCodeMap: {
    [attempt: number]: { code: string; results: TestCaseResult[] };
  } = {
    1: {
      code: attempt?.attemptCode,
      results: attempt?.testCaseResults,
    },
  };

  return (
    <Flex className={classes.wrapper}>
      <Stack align="flex-start">
        <Title>Congratulations 🎉</Title>
        <Text color="dimmed">Completed on {completedAt} </Text>

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
      </Stack>

      <Flex gap={20} w={"100%"}>
        <Paper
          radius="md"
          withBorder
          style={{ flex: 5 }}
          className={classes.paper}
        >
          <Title order={4}>{questionTitle}</Title>
          <ScrollArea type="hover" h={400} mt={10}>
            <TypographyStylesProvider>
              <div
                dangerouslySetInnerHTML={{ __html: questionDescription }}
              ></div>
            </TypographyStylesProvider>
          </ScrollArea>
        </Paper>

        <Paper
          radius="md"
          withBorder
          style={{ flex: 3 }}
          className={classes.paper}
        >
          <Title order={4}>Notes</Title>
          <Textarea
            mt={10}
            autosize
            minRows={15}
            maxRows={15}
            placeholder="Write your notes here"
            value={notes}
            onChange={(event) => {
              setNotes(event.currentTarget.value);
              setToSave(true);
            }}
          />
          <Button onClick={handleSaveNotes} mt={20} disabled={!toSave}>
            Save
          </Button>
        </Paper>
      </Flex>

      <Paper w={"100%"}>
        <Group mb="sm">
          <Title order={4} flex={1}>
            Your Solution
          </Title>
          <Select
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            label="Language"
            defaultValue="python"
            data={["python", "sql"]}
          />
        </Group>
        {/* <CodeEditorWithLanguageSelector
          label=""
          code={userSolution}
          onCodeChange={setUserSolution}
          required={false}
          isReadOnly={true}
        /> */}
        {render && (
          <CodeHighlight
            code={userSolution}
            copyLabel="Copy button code"
            copiedLabel="Copied!"
            language={selectedLanguage}
          />
        )}
      </Paper>

      <Paper radius="md" withBorder className={classes.testCases}>
        <Title order={4}>Test Case Summary</Title>
        <Text>
          Passed: {passed}, Failed: {failed}
        </Text>
        <Box
          // my="md"
          p="md"
          // withBorder
          // className={privateTestsPassed ? classes.ptcPassed : classes.ptcFailed}
        >
          {privateTestsPassed ? (
            <Alert
              variant="light"
              color="green"
              title="All private test cases passed"
              icon={<IconCircleCheckFilled />}
            >
              Details for private test cases are hidden.
            </Alert>
          ) : (
            <Alert
              variant="light"
              color="red"
              title="Some private test cases failed"
              icon={<IconCircleXFilled />}
            >
              Details for private test cases are hidden.
            </Alert>
          )}
        </Box>
        {/* <Accordion multiple mt={10}>
          {testCaseResults.map((result, index) => (
            <Accordion.Item key={index} value={result._id}>
              <Accordion.Control
                icon={
                  result.isPassed ? (
                    <IconCircleCheckFilled
                      style={{ color: "var(--mantine-color-green-6" }}
                    />
                  ) : (
                    <IconCircleXFilled
                      style={{ color: "var(--mantine-color-red-6" }}
                    />
                  )
                }
              >
                Test Case {index + 1} - {result.isPassed ? "Passed" : "Failed"}
              </Accordion.Control>
              <Accordion.Panel>
                <Text>Input: {result.input}</Text>
                <Text>Expected Output: {result.expectedOutput}</Text>
                <Text>Your Output: {result.output}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion> */}
        <TestCasesDisplay testCaseResults={testCaseResults} />
      </Paper>
    </Flex>
  );
}

function TestCasesDisplay({
  testCaseResults,
}: {
  testCaseResults: TestCaseResult[];
}) {
  console.log({ testCaseResults });
  const [currentTestCase, setCurrentTestCase] = useState<TestCaseResult | null>(
    testCaseResults[0]
  );

  useEffect(() => {
    setCurrentTestCase(testCaseResults[0]);
  }, [testCaseResults]);

  function onTestCaseChange(testCaseId: string) {
    setCurrentTestCase(
      testCaseResults.find((testCase) => testCase._id === testCaseId) || null
    );
  }

  function getTestCaseColour(testCaseId: string): ButtonProps["color"] {
    // if latestresult is fail, return red
    const result = testCaseResults.find((result) => result._id === testCaseId);
    if (!result) return "gray";

    if (result.isPassed) {
      return "green";
    } else {
      return "red";
    }
  }

  function getTestCaseResult(
    testCaseId: string,
    _: number
  ): TestCaseResult | undefined {
    return testCaseResults.find((result) => result._id === testCaseId);
  }

  const { colorScheme } = useMantineColorScheme();
  if (!currentTestCase) return null;
  return (
    <Stack style={{ padding: "1rem", gap: "1rem" }}>
      <Group>
        {testCaseResults.map((testCase, index) => (
          <Button
            key={index}
            size="sm"
            color={getTestCaseColour(testCase._id.toString())}
            radius={"sm"}
            variant={testCase._id === currentTestCase?._id ? "filled" : "light"}
            onClick={() => onTestCaseChange(testCase._id)}
            // loading={
            //   isRunning &&
            //   latestResults.find(
            //     (result) =>
            //       result.testCaseDetails.testCaseId === testCase._id.toString()
            //   ) === undefined
            // }
          >
            {index + 1}
          </Button>
        ))}
      </Group>
      {currentTestCase.expectedOutput !== "Hidden" ? (
        <Box className={classes.testCaseDisplay}>
          {getTestCaseResult(currentTestCase._id.toString(), 1) && (
            <Group>
              <Badge
                variant="dot"
                color={getTestCaseColour(currentTestCase._id.toString())}
                size="xl"
                radius="xs"
              >
                {getTestCaseResult(currentTestCase._id.toString(), 1).isPassed
                  ? "Passed"
                  : "Failed"}
              </Badge>
              <Space flex={1} />
              <Group>
                <Badge
                  leftSection={<IconDatabase width="16px" height="16px" />}
                  radius="sm"
                  variant="light"
                  size="lg"
                  styles={{
                    label: {
                      // get rid of uppercase
                      textTransform: "none",
                    },
                  }}
                  color={colorScheme === "dark" ? "gray" : "gray"}
                >
                  {kBtoMb(
                    getTestCaseResult(currentTestCase._id.toString(), 1)?.meta
                      ?.memory || 0
                  )}{" "}
                  MB
                </Badge>
                <Badge
                  leftSection={
                    <IconHourglassEmpty width="16px" height="16px" />
                  }
                  radius="sm"
                  variant="light"
                  size="lg"
                  styles={{
                    label: {
                      // get rid of uppercase
                      textTransform: "none",
                    },
                  }}
                  color={colorScheme === "dark" ? "gray" : "gray"}
                >
                  {secondsToMsIfappropriate(
                    Number(
                      getTestCaseResult(currentTestCase._id.toString(), 1)?.meta
                        ?.time || 0
                    )
                  )}
                </Badge>
              </Group>
            </Group>
          )}
          <SimpleGrid cols={{ base: 1, md: 2 }} mt="lg">
            <Box mb={"md"}>
              <Text style={{ fontWeight: "700" }}> Test Program </Text>
              <Code block mt={"xs"} className={classes.codeBlock}>
                {currentTestCase.input}
              </Code>
            </Box>
            <Box>
              <Text style={{ fontWeight: "700" }}> Expected Output </Text>
              <Code block mt="xs" className={classes.codeBlock}>
                {currentTestCase.expectedOutput}
              </Code>
            </Box>
          </SimpleGrid>

          <Box>
            <Text style={{ fontWeight: "700" }}> Actual output: </Text>
          </Box>
          <Code
            block
            className={classes.codeBlock}
            style={{
              outline:
                getTestCaseResult(currentTestCase._id.toString(), 1) &&
                `1.5px solid var(--mantine-color-${getTestCaseColour(
                  currentTestCase._id.toString()
                )}-9)`,
            }}
            color={
              colorScheme === "light" &&
              `${getTestCaseColour(currentTestCase._id.toString())}.1`
            }
          >
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1).output}
          </Code>

          <Box mt={"xs"}>
            <Text style={{ fontWeight: "700" }}> Error logs: </Text>
          </Box>
          <Code block className={classes.codeBlock}>
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1).error}
          </Code>

          {/* <Accordion variant="separated" mt="md">
            <Accordion.Item value={"code"}>
              <Accordion.Control>
                <b>Submitted code</b>
              </Accordion.Control>
              <Accordion.Panel>
                <CodeHighlight
                  code={attemptCodeMap[attempt]?.code || ""}
                  language="python"
                  copyLabel="Copy button code"
                  copiedLabel="Copied!"
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion> */}
        </Box>
      ) : (
        <Box className={classes.testCaseDisplay}>
          {getTestCaseResult(currentTestCase._id.toString(), 1) && (
            <Group mb={"lg"}>
              <Badge
                variant="dot"
                color={getTestCaseColour(currentTestCase._id.toString())}
                size="xl"
                radius="xs"
              >
                {getTestCaseResult(currentTestCase._id.toString(), 1).isPassed
                  ? "Passed"
                  : "Failed"}
              </Badge>
            </Group>
          )}
          <Alert variant="light">
            This is a private test case! No other details will be shown.
          </Alert>
        </Box>
      )}
    </Stack>
  );
}
