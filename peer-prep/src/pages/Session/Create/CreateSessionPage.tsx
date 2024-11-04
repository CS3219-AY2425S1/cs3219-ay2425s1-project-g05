import {
  Box,
  Button,
  Center,
  Checkbox,
  Divider,
  Flex,
  Group,
  Image,
  MultiSelect,
  SimpleGrid,
  Stack,
  Stepper,
  Title,
  Container,
  Text,
  List,
  rem,
  ThemeIcon,
  Progress,
} from "@mantine/core";
import classes from "./CreateSessionPage.module.css";
import { useEffect, useState } from "react";
import {
  capitalizeFirstLetter,
  convertToCombinedCategoryId,
} from "../../../utils/utils";
import { Link, useLoaderData, useNavigate } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { Category, CategoryResponseData, Question } from "../../../types/question";
import { socket } from "../../../websockets/socket";
import { useAuth } from "../../../hooks/useAuth";
import { displayName } from "react-quill";
import SearchingPage from "../Search/SearchingPage";
import {
  IconCancel,
  IconCircleCheck,
  IconCircleDashed,
  IconCross,
} from "@tabler/icons-react";

import NoMatchImage from "../../../assets/nomatchimage.svg";
import SearchingImage from "../../../assets/searchimage.svg";
import MatchImage from "../../../assets/matchimage.svg";

import AlertBox from "../../../components/Alert/AlertBox";
import { notifications } from "@mantine/notifications";

// Arrays
// Algorithms
// Databases
// Data Structures
// Brainteaser
// Strings
// Bit Manipulation
// Recursion

enum Status {
  IDLE,
  SEARCHING,
  MATCH_FOUND,
  NO_MATCH,
}

interface CollabResponse {
  roomId: string;
  question: Question;
}

export default function CreateSessionPage() {
  // TODO: query the question service to get a list of categories and difficulties
  const { fetchData } = useApi();
  const navigate = useNavigate();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [intervalTimer, setIntervalTimer] = useState<NodeJS.Timeout | null>();
  let timer: NodeJS.Timeout | null = null;
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [matchFound, setMatchFound] = useState(false);

  useEffect(() => {
    fetchData<ServerResponse<CategoryResponseData>>(
      `/question-service/categories`,
      SERVICE.QUESTION
    ).then((response) => {
      const categories = response.data.categories.categories || [];
      const categoriesId = response.data.categories.categoriesId || [];

      const convertedCategories = convertToCombinedCategoryId(
        categories,
        categoriesId
      );
      const transformedCategories = convertedCategories.map((c) => ({
        value: c.id.toString(),
        label:
          c.category.charAt(0).toUpperCase() +
          c.category.slice(1).toLowerCase(),
      }));

      setCategories(transformedCategories);
    });
  }, []);

  const [categories, setCategories] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [selectedCategoriesId, setSelectedCategoriesId] = useState<string[]>(
    []
  );

  const [difficulties, setDifficulties] = useState<string[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );

  const { user } = useAuth();

  const canSearch =
    selectedCategoriesId.length > 0 && selectedDifficulties.length > 0;

  // const data = useLoaderData() as ServerResponse<[string[]]>;

  // useEffect(() => {
  //   console.log("data from preload:", data);
  //   if (data.data) {
  //     setCategories(data.data[0]);
  //   }
  // }, [data]);

  // initialize socket
  useEffect(() => {
    socket.connect();

    function onConnect() {
      console.log("connected to server");
    }

    function onWaitingForMatch() {
      console.log("waiting for a match");

      setStatus(Status.SEARCHING);
      setActive(1);

      // clear old timer
      if (timer) {
        clearInterval(timer);
      }
      // setup a timer
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    async function onFoundMatch(data) {
      console.log("found a match", data);
      
      setStatus(Status.MATCH_FOUND);
      setActive(2);

      try {
        // Create a room with the matched users and question for the session
        fetchData<ServerResponse<CollabResponse>>(
          `/collaboration-service/create-room`,
          SERVICE.COLLAB,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              users: data.userIds,
              question: data.question
            }),
          }
        ).then((response) => {
          // console.log("response from collab service", response.data);
          const roomId = response.data['roomId'];
          const question = response.data['question'];

          console.log("room id after creating room ", roomId);
          console.log("question after creating room", question);
          
          setMatchFound(true); // Display the success component when a match is found

          // Start countdown timer
          const interval = setInterval(() => {
            setRedirectCountdown((prevCountdown) => {
              if (prevCountdown <= 1) {
                clearInterval(interval);
                goToRoom(question, roomId, response.data); // Redirect to room
              }
              return prevCountdown - 1;
            });
          }, 1000);

        })
        .catch((error) => {
          console.error("Error creating room", error);
        });

        // stop the timer
        if (timer) {
          clearInterval(timer);
        }
      } catch (error: any) {
        console.error("Error creating room", error);
        notifications.show({
          message: error.message || "Failed to create room.",
          color: "red",
        });
      }
    }

    function onNoMatch() {
      console.log("no match found");

      setStatus(Status.NO_MATCH);
      setActive(2);

      // stop the timer
      if (timer) {
        clearInterval(timer);
      }
    }

    socket.on("connect", onConnect);
    socket.on("finding-match", onWaitingForMatch);
    socket.on("found-match", onFoundMatch);
    socket.on("no-match", onNoMatch);

    return () => {
      // clear up socket

      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("finding-match", onWaitingForMatch);
      socket.off("found-match", onFoundMatch);
      socket.off("no-match", onNoMatch);
      console.log("we are disconnected");
    };
  }, []);

  const [status, setStatus] = useState(Status.IDLE);

  const [active, setActive] = useState(0);

  function search() {
    if (!canSearch) {
      return;
    }

    const query = {
      categoriesId: selectedCategoriesId.map(Number),
      difficulties: selectedDifficulties.map((d) => d.toUpperCase()),
      userId: user._id,
    };

    // fire a socket event
    socket.emit("create-match", query);
    console.log("searching for a match");
  }

  function goToStart() {
    setActive(0);
    setStatus(Status.IDLE);

    // reset timer
    setTimeElapsed(0);
    if (timer) {
      clearInterval(timer);
    }

    // setSelectedCategories([]);
    // setSelectedDifficulties([]);
  }

  function changeCriteria() {
    socket.emit("cancel-match");
    goToStart();
  }

  function continueSearch() {
    setActive(1);
    setStatus(Status.SEARCHING);

    search();
  }

  function goToRoom(question, roomId, matchData) {
    navigate(`/session/${roomId}`, { state: { questionReceived: question, roomIdReceived: roomId, matchData } });
  }

  const CREATE_COMPONENT = (
    <>
      {/* <Title> Create a session </Title> */}
      {/* <MultiSelect
          label="Your favorite libraries"
          placeholder="Pick value"
          data={["React", "Angular", "Vue", "Svelte"]}
        /> */}

      <SimpleGrid cols={2}>
        <Stack className={classes.criteria}>
          <Title order={4}> Categories </Title>
          <Checkbox.Group
            defaultValue={[]}
            label="Pick one or more categories to search for"
            description=""
            withAsterisk
            value={selectedCategoriesId}
            onChange={(value) => setSelectedCategoriesId(value)}
          >
            <Stack mt="xs">
              {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
              {categories.map((category, index) => (
                <Checkbox
                  value={category.value}
                  label={category.label}
                  key={index}
                />
              ))}
            </Stack>
          </Checkbox.Group>
          <Divider />
          <Checkbox
            checked={selectedCategoriesId.length === categories.length}
            indeterminate={
              selectedCategoriesId.length !== categories.length &&
              selectedCategoriesId.length > 0
            }
            label={
              selectedCategoriesId.length > 0
                ? `${selectedCategoriesId.length} selected`
                : "Select all"
            }
            onChange={() => {
              // if indeterminate, select all
              // if all selected, deselect all
              // if none selected, select all
              if (selectedCategoriesId.length === categories.length) {
                setSelectedCategoriesId([]);
              } else {
                setSelectedCategoriesId(categories.map((v) => v.value));
              }
            }}
          />
        </Stack>
        <Stack className={classes.criteria}>
          <Title order={4}> Difficulties </Title>
          <Checkbox.Group
            defaultValue={[]}
            label="Pick one or more difficulties to search for"
            description=""
            withAsterisk
            value={selectedDifficulties}
            onChange={(value) => setSelectedDifficulties(value)}
          >
            <Stack mt="xs">
              {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
              {difficulties.map((difficulty, index) => (
                <Checkbox
                  value={difficulty}
                  label={capitalizeFirstLetter(difficulty)}
                  key={index}
                />
              ))}
            </Stack>
          </Checkbox.Group>
          <Divider />
          <Checkbox
            checked={selectedDifficulties.length === difficulties.length}
            indeterminate={
              selectedDifficulties.length !== difficulties.length &&
              selectedDifficulties.length > 0
            }
            label={
              selectedDifficulties.length > 0
                ? `${selectedDifficulties.length} selected`
                : "Select all"
            }
            onChange={() => {
              // if indeterminate, select all
              // if all selected, deselect all
              // if none selected, select all
              if (selectedDifficulties.length === difficulties.length) {
                setSelectedDifficulties([]);
              } else {
                setSelectedDifficulties(difficulties);
              }
            }}
          />
        </Stack>
      </SimpleGrid>
      <Center>
        <Button
          mt={"2rem"}
          // component={Link}
          // to="/session/search"
          disabled={!canSearch}
          style={{ pointerEvents: !canSearch ? "none" : "unset" }}
          onClick={() => search()}
        >
          Begin search
        </Button>
      </Center>
    </>
  );

  const SEARCH_COMPONENT = (
    <>
      <Stack gap={"2rem"}>
        <Center>
          <Image className={classes.image} src={SearchingImage} />
        </Center>
        <Title style={{ textAlign: "center" }}>
          {" "}
          <span className={classes.hourglass}> ⏳ </span> Loading...{" "}
        </Title>
        <Progress color="cyan" value={100} striped animated />

        <Stack gap={0}>
          <Text style={{ textAlign: "center" }}>
            {" "}
            You will be matched with a partner soon!{" "}
          </Text>
          <Text style={{ textAlign: "center" }}>
            {" "}
            Time elapsed:{" "}
            <span className={classes.time}> {timeElapsed} seconds </span>{" "}
          </Text>
        </Stack>

        <SimpleGrid cols={2} className={classes.criteria}>
          <Stack>
            <Text fw={600} size="lg">
              {" "}
              Categories
            </Text>
            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon size={24} radius="xl">
                  <IconCircleCheck
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </ThemeIcon>
              }
            >
              {selectedCategoriesId.map((categories, index) => (
                <List.Item key={index}>{categories}</List.Item>
              ))}
            </List>
          </Stack>
          <Stack>
            <Text fw={600} size="lg">
              {" "}
              Difficulties
            </Text>
            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon size={24} radius="xl">
                  <IconCircleCheck
                    style={{ width: rem(16), height: rem(16) }}
                  />
                </ThemeIcon>
              }
            >
              {selectedDifficulties.map((difficulties, index) => (
                <List.Item key={index}>
                  {capitalizeFirstLetter(difficulties)}
                </List.Item>
              ))}
            </List>
          </Stack>
        </SimpleGrid>
        <Center>
          <Button onClick={() => changeCriteria()}>Change criteria</Button>
        </Center>
      </Stack>
    </>
  );

  const FAIL_COMPONENT = (
    <Stack gap={"2em"}>
      <Center>
        <Image className={classes.image} src={NoMatchImage} />
      </Center>
      <AlertBox type="error">
        <Stack justify="center">
          <Text fw={700} size="xl" style={{ textAlign: "center" }}>
            {" "}
            Couldn't find a match!{" "}
          </Text>
          <Text style={{ textAlign: "center" }}>
            Try changing your criteria?
          </Text>
          <Center>
            <Group>
              <Button
                variant="light"
                onClick={() => {
                  goToStart();
                }}
                color="orange"
              >
                {" "}
                Change criteria{" "}
              </Button>
              <Button
                onClick={() => {
                  continueSearch();
                }}
              >
                {" "}
                Continue searching{" "}
              </Button>
            </Group>
          </Center>
        </Stack>
      </AlertBox>
    </Stack>
  );

  const SUCCESS_COMPONENT = (
    <>
      <Stack gap={"2em"}>
        <Center>
          <Image className={classes.image} src={MatchImage} />
        </Center>
        <AlertBox type="success">
          <Stack justify="center">
            <Text fw={700} size="xl" style={{ textAlign: "center" }}>
              {" "}
              Found a match for you!
            </Text>
            <Text style={{ textAlign: "center" }}>
              You'll be redirected to the room in {redirectCountdown} seconds...
            </Text>
            {/* <Center>
              <Button
                // onClick={() => {
                //   goToRoom();
                // }}
              >
                {" "}
                Go to room{" "}
              </Button>
            </Center> */}
          </Stack>
        </AlertBox>
      </Stack>
    </>
  );
  return (
    <Container>
      <Flex className={classes.wrapper}>
        <Box
          style={{
            width: "100%",
          }}
        >
          <Stepper active={active} onStepClick={setActive}>
            <Stepper.Step
              label="Create"
              description={active === 0 && "Specify criteria"}
              allowStepSelect={false}
            >
              <Box className={classes.stepWrapper}>{CREATE_COMPONENT}</Box>
            </Stepper.Step>
            <Stepper.Step
              label="Search"
              description={active === 1 && "Seaching for a match..."}
              allowStepSelect={false}
              loading={status === Status.SEARCHING}
            >
              <Box className={classes.stepWrapper}>{SEARCH_COMPONENT}</Box>
            </Stepper.Step>
            {status === Status.NO_MATCH ? (
              <Stepper.Step
                label="Matching failed!"
                description={"No match found"}
                allowStepSelect={false}
                icon={<IconCancel />}
                color="red"
              >
                <Box className={classes.stepWrapper}>{FAIL_COMPONENT}</Box>
              </Stepper.Step>
            ) : (
              <Stepper.Step
                label="Matched!"
                description={
                  active === 2 && Status.MATCH_FOUND && "Match found!"
                }
                allowStepSelect={false}
              >
                <Box className={classes.stepWrapper}>{SUCCESS_COMPONENT}</Box>
              </Stepper.Step>
            )}
          </Stepper>
        </Box>
      </Flex>
    </Container>
  );
}
