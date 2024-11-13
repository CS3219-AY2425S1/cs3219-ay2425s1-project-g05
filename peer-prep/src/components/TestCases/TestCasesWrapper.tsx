// Note: handle run and history service in here
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  ButtonProps,
  Card,
  Code,
  Collapse,
  Group,
  Loader,
  rem,
  SimpleGrid,
  Space,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import classes from "./TestCasesWrapper.module.css";
import {
  ExecutionResultSchema,
  FinalResult,
  PartialResult,
  Question,
  TestCase,
  TestCaseResult,
} from "../../types/question";
import { useEffect, useRef, useState } from "react";
import useApi, { ServerResponse, SERVICE } from "../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useColorScheme, useTimeout } from "@mantine/hooks";
import { clear } from "console";
import { IconDatabase, IconHourglassEmpty } from "@tabler/icons-react";
import { kBtoMb, secondsToMsIfappropriate } from "../../utils/utils";
import { CodeHighlight } from "@mantine/code-highlight";

import "@mantine/code-highlight/styles.css";
import { useAuth } from "../../hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { useAi } from "../../hooks/useAi";

type TestCasesWrapperProps = {
  testCases: TestCase[]; // array of test cases
  channelId: string | null;
  questionId: string | null;

  // to decide if we want to pass down a function from parent instead of passing down solutioncode
  // runAllTestCases: () => void;

  currentValueRef: React.MutableRefObject<string>;
  otherUserId: string;
  userId: string;

  latestResultsRef: React.MutableRefObject<TestCaseResult[]>;

  roomId: string;
  question: string;
};

const STATUS_PARTIAL = 206;
const STATUS_COMPLETE = 200;
const STATUS_CONNECTED = 201;
const STATUS_STARTED = 202;

export default function TestCasesWrapper({
  testCases,
  channelId,
  // runAllTestCases,
  questionId,
  currentValueRef,

  userId,
  otherUserId,

  latestResultsRef,

  roomId,
  question,
}: TestCasesWrapperProps) {
  const [latestResults, setLatestResults] = useState<TestCaseResult[]>([]);

  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(
    testCases[0]
  );
  const { colorScheme } = useMantineColorScheme();
  const { fetchData } = useApi();
  // set to false only when receive back full result from SSE
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const { start: startRunningTimeout, clear: clearRunningTimeout } = useTimeout(
    () => {
      setIsError(true);
      setIsRunning(false);
      notifications.show({
        title: "Error running test cases",
        message:
          "There was an unknown error running the test cases. Timed out after 10 seconds. Please try again.",
        color: "red",
      });
    },
    20000
  );

  const [isError, setIsError] = useState<boolean>(false);
  const [testCaseRunKey, setTestCaseRunKey] = useState(0);

  // array of tries for each attempt
  // const [allResults, setAllResults] = useState<TestCaseResult[][]>([]);
  const [attemptCodeMap, setAttemptCodeMap] = useState<{
    [attempt: number]: { code: string; results: TestCaseResult[] };
  }>({});

  // this is ridiculous, because I don't want to keep registering and
  // unregistering the listener, we need a Ref to store the attempt
  // this useState version of attempt is getting stored in the closure of the event listener
  // a Ref would not have this issue as it is call-by-reference
  // we need both as I need to update state based on attempt number
  const [attempt, setAttempt] = useState<number>(0);
  const attemptRef = useRef<number>(0);

  function incrementAttempt() {
    setAttempt((prev) => prev + 1);
    attemptRef.current = attemptRef.current + 1;
  }

  console.log(attemptCodeMap, "asdnashjkdhbj");

  const onMessage = (event: MessageEvent<string>) => {
    console.log("LOG: event source on message");
    console.log(event);
    const message: ExecutionResultSchema = JSON.parse(event.data);

    console.log("INFO ✅: Message json formatted ", message);

    switch (message.statusCode) {
      case STATUS_PARTIAL:
        const result = (message.data as PartialResult).result;
        console.log("INFO: One result", result);
        latestResultsRef.current = [...latestResultsRef.current, result];
        setLatestResults((prev) => [...prev, result]);

        break;
      case STATUS_COMPLETE:
        console.log("INFO: Complete result received");
        const { results, code } = message.data as FinalResult;
        // setLatestResults(message.data.);

        setIsRunning(false);
        notifications.show({
          message: `All test cases have attempted to execute.`,
        });

        setLatestResults(results);
        latestResultsRef.current = results;

        setAttemptCodeMap((prev) => ({
          ...prev,
          [attemptRef.current]: {
            code,
            results,
          },
        }));

        // console.log("INFO: Latest results", results);
        clearRunningTimeout();

        console.log("INFO: ✅ Test Cases Ran Successfuly");
        console.log({ attemptCodeMap });

        // check for TLE
        // if (results.some((result) => result.isPassed === false && Number(result.time) > 4.96)){
        //   // time limit exceeded
        // }

        break;
      case STATUS_CONNECTED:
        break;
      case STATUS_STARTED:
        notifications.show({
          message: `Executing ${testCases.length} test cases`,
        });

        incrementAttempt();

        setIsError(false);
        setIsRunning(true);

        // latest results should have already been copied into all results
        setLatestResults([]);
        latestResultsRef.current = [];
        startRunningTimeout();
        break;
      default:
        clearRunningTimeout();
        setIsError(true);
    }
  };

  const onConnect = (event: Event) => {
    console.log("LOG: event source on connect");
    console.log(event);
  };

  const onError = (event: Event) => {
    console.log("LOG: event source on error");
    console.log(event);
  };
  // ---- effects
  useEffect(() => {
    if (!channelId) return;
    // subscribe to eventsource SSE
    const eventSource = new EventSourcePolyfill(
      `${
        import.meta.env.VITE_API_URL_RUN
      }/run-service/subscribe/${channelId}?userId=${userId}&otherUserId=${otherUserId}`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          // "Cache-Control": "no-cache",
          // Connection: "keep-alive",
          // "X-Accel-Buffering": "no",
        },
        heartbeatTimeout: 1000 * 60 * 60 * 24,
      }
    );

    eventSource.onmessage = onMessage;
    eventSource.onopen = onConnect;
    eventSource.onerror = onError;

    return () => {
      // disconnect the event source
      eventSource.close();
    };
  }, [channelId]);

  function onTestCaseChange(testCaseId: number) {
    // find the test case and set it
    const testCase = testCases.find((testCase) => testCase._id === testCaseId);
    setCurrentTestCase(testCase);
  }

  function runTestCases() {
    console.log("LOG: Current code value", currentValueRef.current);
    setIsRunning(true);
    setLatestResults([]);
    latestResultsRef.current = [];
    setIsError(false);
    fetchData<
      ServerResponse<{
        testCaseCount: number;
      }>
    >(`/run-service/execute/${questionId}`, SERVICE.RUN, {
      method: "POST",
      body: JSON.stringify({
        codeAttempt: currentValueRef.current,
        channelId,
        firstUserId: userId,
        secondUserId: otherUserId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log({ response });
        setTestCaseRunKey(prev => prev + 1); // Change key to reset the display of test cases
      })
      .catch((e) => {
        console.log("ERROR⚠️: Error running test cases");
        console.error(e);

        // don't need to set isRunning to false here, we are technically still running the test cases
        if (e.statusCode === 409) {
          notifications.show({
            title: "Test cases already running",
            message: "Test cases for this question are already running",
            // color: "red",
          });
        } else {
          notifications.show({
            title: "Error running test cases",
            message:
              "There was an unknown error running the test cases. Please try again.",
            color: "red",
          });
          setIsError(true);
          setIsRunning(false);
        }

        // 404: testcases/question not found
        // 409: testcases for this question and channel already running
      });
  }

  function getTestCaseResult(
    testCaseId: string,
    runNumber: number // unused for now, -1 means latest
  ): TestCaseResult | undefined {
    // find the test case and get the result
    return latestResults.find(
      (result) => result.testCaseDetails.testCaseId === testCaseId
    );
  }

  function getTestCaseColour(testCaseId: string): ButtonProps["color"] {
    // if latestresult is fail, return red
    const result = getTestCaseResult(testCaseId, -1);
    if (!result) return "gray";

    if (result.isPassed) {
      return "green";
    } else {
      return "red";
    }
  }
  console.log({ colorScheme });


  return (
    <Box className={classes.container}>
      <Group style={{ alignItems: "center" }}>
        <Title
          flex={1}
          order={3}
          style={{ fontSize: "1.5rem", marginRight: "1rem" }}
        >
          Test Cases ({testCases.length})
        </Title>
        <Button variant="light" onClick={runTestCases} loading={isRunning}>
          {" "}
          Run all testcases{" "}
        </Button>
      </Group>
      <TestCasesDisplay
        key={testCaseRunKey}
        attempt={attempt}
        attemptCodeMap={attemptCodeMap}
        isRunning={isRunning}
        latestResults={latestResults}
        testCases={testCases}
        roomId={roomId}
        userId={userId}
        question={question}
      />
      <>
        {/* <>
          <Group>
            {testCases.map((testCase, index) => (
              <Button
                key={index}
                size="sm"
                color={getTestCaseColour(testCase._id.toString())}
                radius={"sm"}
                variant={
                  testCase._id === currentTestCase?._id ? "filled" : "light"
                }
                onClick={() => onTestCaseChange(testCase._id)}
                loading={
                  isRunning &&
                  latestResults.find(
                    (result) =>
                      result.testCaseDetails.testCaseId ===
                      testCase._id.toString()
                  ) === undefined
                }
              >
                {index + 1}
              </Button>
            ))}
          </Group>
          {currentTestCase && currentTestCase.isPublic ? (
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
                        getTestCaseResult(currentTestCase._id.toString(), 1)
                          .memory
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
                          getTestCaseResult(currentTestCase._id.toString(), 1)
                            .time
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
                    {currentTestCase.testCode}
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
                {getTestCaseResult(currentTestCase._id.toString(), 1) ===
                undefined
                  ? "No output yet, please run the test case to view output"
                  : getTestCaseResult(currentTestCase._id.toString(), 1).stdout}
              </Code>

              <Box mt={"xs"}>
                <Text style={{ fontWeight: "700" }}> Error logs: </Text>
              </Box>
              <Code block className={classes.codeBlock}>
                {getTestCaseResult(currentTestCase._id.toString(), 1) ===
                undefined
                  ? "No output yet, please run the test case to view output"
                  : getTestCaseResult(currentTestCase._id.toString(), 1).stderr}
              </Code>

              <Accordion variant="separated" mt="md">
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
              </Accordion>
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
        </> */}
      </>
    </Box>
  );
}

export const TestCasesDisplay = ({
  testCases,
  latestResults,
  isRunning,
  attemptCodeMap,
  attempt,
  userId,
  roomId,
  question,
}: {
  testCases: TestCase[];
  latestResults: TestCaseResult[];
  isRunning: boolean;
  attemptCodeMap: {
    [attempt: number]: { code: string; results: TestCaseResult[] };
  };
  attempt: number;
  userId: string;
  roomId: string;
  question: string;
}) => {
  const { fetchData } = useApi();
  const { setApiKeyModalVisible, hasApiKey } = useAi();

  const { colorScheme } = useMantineColorScheme();
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(
    testCases[0]
  );

  // TODO: REFACTOR overlapping code for failed test case analysis and error logs analysis

  // FOR FAILED TEST CASE ANALYSIS
  const [openedTestCaseAnalysis, setOpenedTestCaseAnalysis] = useState(false);
  const [loadingTestCaseAnalysis, setLoadingTestCaseAnalysis] = useState(false);
  const [generatedTestCaseAnalysis, setGeneratedTestCaseAnalysis] = useState(false);

  const [displayedLinesTestCaseAnalysis, setDisplayedLinesTestCaseAnalysis] = useState([]);
  const [analysisResultTestCaseAnalysis, setAnalysisResultTestCaseAnalysis] = useState(null);
  const [errorRetrievingTestCaseAnalysis, setErrorRetrievingTestCaseAnalysis] = useState(false);

  // FOR ERROR LOGS ANALYSIS
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [generated, setGenerated] = useState(false);

  const [displayedLines, setDisplayedLines] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorRetrieving, setErrorRetrieving] = useState(false);

  interface AiChatResponse {
    reply: string;
  }

  function onTestCaseChange(testCaseId: number) {
    // find the test case and set it
    const testCase = testCases.find((testCase) => testCase._id === testCaseId);
    setCurrentTestCase(testCase);
  }

  function getTestCaseResult(
    testCaseId: string,
    runNumber: number // unused for now, -1 means latest
  ): TestCaseResult | undefined {
    // find the test case and get the result
    return latestResults.find(
      (result) => result.testCaseDetails.testCaseId === testCaseId
    );
  }

  function getTestCaseColour(testCaseId: string): ButtonProps["color"] {
    // if latestresult is fail, return red
    const result = getTestCaseResult(testCaseId, -1);
    if (!result) return "gray";

    if (result.isPassed) {
      return "green";
    } else {
      return "red";
    }
  }

  useEffect(() => {
    // Clear AI analysis when the component re-renders due to key change or testCases change
    setAnalysisResultTestCaseAnalysis(null);
    setDisplayedLinesTestCaseAnalysis([]);
    setGeneratedTestCaseAnalysis(false);

    setAnalysisResult(null);
    setDisplayedLines([]);
    setGenerated(false);
  }, [testCases]);
  
  const handleAnalyseClick = async () => {
    // User must key in their API key first to use the AI service, show modal if they have not
    if (!hasApiKey) {
      setApiKeyModalVisible(true);
      return;
    }

    setOpened(true);
    setLoading(true);

    // Clear previous analysis results
    setAnalysisResult(null);
    setDisplayedLines([]);
    setErrorRetrieving(false);

    // Retrieve solution code and error logs to send to AI
    const solutionCode = attemptCodeMap[attempt]?.code || '';
    const errorLogs = getTestCaseResult(currentTestCase._id.toString(), 1)?.stderr || '';

    console.log('Solution code:', solutionCode);
    console.log('Error logs:', errorLogs);

    // Send the prompt to the AI for analysis
    fetchData<ServerResponse<AiChatResponse>>(
      `/gen-ai-service/analyse-error-logs`,
      SERVICE.AI,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorLogs,
          solutionCode,
          userId,
          roomId,
        }),
      }
    ).then((res) => {
      if (res.statusCode === 200) {
        console.log('AI Analysis:', res.data.reply);
        setAnalysisResult(res.data.reply);

        const lines = res.data.reply.trim().split('\n');
        displayLines(lines);

        setGenerated(true);
        setLoading(false);
        setAnalysisResult(res.data.reply);
      } else {
        console.error('Error fetching AI analysis:', res.data.reply);
        setLoading(false);
        setAnalysisResult('Failed to fetch AI analysis. Please try again.');
        setErrorRetrieving(true);
      }
    }).catch((error) => {
      // Simulate delay before error handling
      setTimeout(() => {
        console.error('Error fetching AI analysis:', error);
        setAnalysisResult('Failed to fetch AI analysis. Please try again.');
        setErrorRetrieving(true);
        setLoading(false);
      }, 1500);  // 1.5 second delay before handling the error
    });
  };

  // Function to display AI analysis line by line
  const displayLines = (lines) => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedLines((prevLines) => [...prevLines, lines[index]]);
      index++;
      if (index >= lines.length) clearInterval(interval);
    }, 500);
  };

  const handleFailedTestCaseAnalyseClick = async () => {
    // User must key in their API key first to use the AI service, show modal if they have not
    if (!hasApiKey) {
      setApiKeyModalVisible(true);
      return;
    }

    setOpenedTestCaseAnalysis(true);
    setLoadingTestCaseAnalysis(true);

    // Clear previous analysis results
    setAnalysisResultTestCaseAnalysis(null);
    setDisplayedLinesTestCaseAnalysis([]);
    setErrorRetrievingTestCaseAnalysis(false);

    const testProgramCode = currentTestCase.testCode;
    const expectedOutput = currentTestCase.expectedOutput;
    const actualOutput = getTestCaseResult(currentTestCase._id.toString(), 1)?.stdout || '';
    const solutionCode = attemptCodeMap[attempt]?.code || '';

    console.log('Test program code:', testProgramCode);
    console.log('Expected output:', expectedOutput);
    console.log('Actual output:', actualOutput);
    console.log('Solution code:', solutionCode);

    // Make the API request to fetch failed test case analysis
    fetchData<ServerResponse<AiChatResponse>>(
      `/gen-ai-service/analyse-failed-test-cases`,
      SERVICE.AI,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testProgramCode,
          expectedOutput,
          actualOutput,
          solutionCode,
          question,
          userId,
          roomId,
        }),
      }
    ).then((res) => {
      if (res.statusCode === 200) {
        console.log('AI Analysis:', res.data.reply);
        setAnalysisResultTestCaseAnalysis(res.data.reply);

        const lines = res.data.reply.trim().split('\n');
        displayFailedTestCaseLines(lines);
        setAnalysisResultTestCaseAnalysis(res.data.reply);
        setLoadingTestCaseAnalysis(false);
      } else {
        console.log('got problem with ai analysis');
        console.error('Error fetching failed test case analysis:', res.data.reply);
        setAnalysisResultTestCaseAnalysis('Failed to fetch failed test case analysis. Please try again.');
        setErrorRetrievingTestCaseAnalysis(true);
        setLoadingTestCaseAnalysis(false);
      }
    }).catch((error) => {
      // Simulate delay before error handling
      setTimeout(() => {
        console.error('Error fetching failed test case analysis:', error);
        setAnalysisResultTestCaseAnalysis('Failed to fetch failed test case analysis. Please try again.');
        setErrorRetrievingTestCaseAnalysis(true);
        setLoadingTestCaseAnalysis(false);
      }, 1500);  // 1.5 second delay before handling the error
    });
  };

  const displayFailedTestCaseLines = (lines: string[]) => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedLinesTestCaseAnalysis((prevLines) => [...prevLines, lines[index]]);
      index++;
      if (index >= lines.length) clearInterval(interval);
    }, 500);
    setGeneratedTestCaseAnalysis(true);
    setLoadingTestCaseAnalysis(false);
  };

  // Function to handle loading dots animation
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500); 
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let interval;
    if (loadingTestCaseAnalysis) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500); 
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [loadingTestCaseAnalysis]);

  return (
    <>
      <Group>
        {testCases.map((testCase, index) => (
          <Button
            key={index}
            size="sm"
            color={getTestCaseColour(testCase._id.toString())}
            radius={"sm"}
            variant={testCase._id === currentTestCase?._id ? "filled" : "light"}
            onClick={() => onTestCaseChange(testCase._id)}
            loading={
              isRunning &&
              latestResults.find(
                (result) =>
                  result.testCaseDetails.testCaseId === testCase._id.toString()
              ) === undefined
            }
          >
            {index + 1}
          </Button>
        ))}
      </Group>
      {currentTestCase && currentTestCase.isPublic ? (
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
                    getTestCaseResult(currentTestCase._id.toString(), 1).memory
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
                      getTestCaseResult(currentTestCase._id.toString(), 1).time
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
                {currentTestCase.testCode}
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
              : getTestCaseResult(currentTestCase._id.toString(), 1).stdout}
          </Code>
          {!getTestCaseResult(currentTestCase._id.toString(), 1)?.isPassed && getTestCaseResult(currentTestCase._id.toString(), 1)?.stdout && (
            <>
              <Button
                onClick={handleFailedTestCaseAnalyseClick}
                mt={8}
                disabled={loadingTestCaseAnalysis}
                variant="gradient" 
                gradient={{ from: "violet", to: "blue", deg: 135 }}
                style={{
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', 
                  borderRadius: '12px', 
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} 
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <>
                  {loadingTestCaseAnalysis && <Loader size="xs" mr={8} color="grey" />}
                  {generatedTestCaseAnalysis && !loadingTestCaseAnalysis ? 
                    'Re-analyse Failing TC with Google Gemini' : 
                    'Analyse Failing TC with Google Gemini'}
                  <Badge
                    variant="gradient"
                    gradient={{ from: "violet", to: "blue", deg: 135 }}
                    radius={"xs"}
                    style={{ cursor: "pointer", marginLeft: '8px' }} 
                  >
                    AI
                  </Badge>
                </>
              </Button>
              {openedTestCaseAnalysis && generatedTestCaseAnalysis && (
                <Button onClick={() => setOpenedTestCaseAnalysis(false)} mt={8} ml={8}>Hide</Button>
              )}
              {!openedTestCaseAnalysis && generatedTestCaseAnalysis && (
                <Button onClick={() => setOpenedTestCaseAnalysis(true)} mt={8} ml={8}>Show</Button>
              )}

              <Card shadow="sm" padding="lg" mt="md" radius="md" withBorder display={openedTestCaseAnalysis ? 'block' : 'none'}>
                <Box>
                  {loadingTestCaseAnalysis && (
                    <Text mt="xs">Analysing failing test case{dots}</Text>
                  )}

                  {/* TODO: display code in code block */}
                  {/* Display AI analysis result line by line */}
                  {!loadingTestCaseAnalysis && analysisResultTestCaseAnalysis && displayedLinesTestCaseAnalysis.length > 0 && (
                    displayedLinesTestCaseAnalysis.map((line, index) => (
                      <ReactMarkdown key={index}>{line}</ReactMarkdown>
                    ))
                  )}

                  {/* Fallback message if no analysis is available */}
                  {!loadingTestCaseAnalysis && errorRetrievingTestCaseAnalysis && (
                    <Text>No analysis available. Please try again.</Text>
                  )}
                </Box>
              </Card>
            </>
          )}

          <Box mt={"xs"}>
            <Text style={{ fontWeight: "700" }}> Error logs: </Text>
          </Box>
          <Code block className={classes.codeBlock}>
            {getTestCaseResult(currentTestCase._id.toString(), 1) === undefined
              ? "No output yet, please run the test case to view output"
              : getTestCaseResult(currentTestCase._id.toString(), 1).stderr}
          </Code>

          {getTestCaseResult(currentTestCase._id.toString(), 1)?.stderr && (
            <>
              <Button
                onClick={handleAnalyseClick}
                mt={8}
                disabled={loading}
                variant="gradient"
                gradient={{ from: "violet", to: "blue", deg: 135 }}
                style={{
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <>
                  {loading && <Loader size="xs" mr={8} color="grey" />}
                  {generated && !loading ? 'Re-analyse Errors with Google Gemini' : 'Analyse Errors with Google Gemini'}
                  <Badge
                    variant="gradient"
                    gradient={{ from: "violet", to: "blue", deg: 135 }}
                    radius={"xs"}
                    style={{ cursor: "pointer", marginLeft: '8px' }}
                  >
                    AI
                  </Badge>
                </>
              </Button>
              {opened && generated && (
                <Button onClick={() => setOpened(false)} mt={8} ml={8}>Hide</Button>
              )}
              {!opened && generated && (
                <Button onClick={() => setOpened(true)} mt={8} ml={8}>Show</Button>
              )}

              <Card shadow="sm" padding="lg" mt="md" radius="md" withBorder display={opened ? 'block' : 'none'}>
                <Box>
                  {loading && (
                    <Text mt="xs">Analysing error logs{dots}</Text>
                  )}

                  {/* Display AI analysis result line by line */}
                  {!loading && analysisResult && displayedLines.length > 0 && (
                    displayedLines.map((line, index) => (
                      <ReactMarkdown key={index}>{line}</ReactMarkdown>
                    ))
                  )}

                  {/* Fallback message if no analysis is available */}
                  {!loading && errorRetrieving && (
                    <Text>No analysis available. Please try again.</Text>
                  )}
                </Box>
              </Card>
            </>
          )}

          <Accordion variant="separated" mt="md">
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
          </Accordion>
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
    </>
  );
};
