import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useAuth } from "../../hooks/useAuth";
import QuestionCard from "../../components/Questions/QuestionCard/QuestionCard";
import { SAMPLE_QUESTIONS } from "../../types/question";

import classes from "./DashboardPage.module.css";
import { Link } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../hooks/useApi";
import { AttemptData, AttemptsData, UserAttempt } from "../../types/attempts";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import TextChatWidget from "../../components/Communication/Text/TextChatWidget";
import AttemptCard from "../../components/Attempts/AttemptCard/AttemptCard";
import { IconClipboardCheck } from "@tabler/icons-react";
export default function DashboardPage() {
  const { user } = useAuth();
  const { fetchData } = useApi();

  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserAttempts = async () => {
    try {
      setIsLoading(true);
      const response = await fetchData<ServerResponse<AttemptsData>>(
        "/history-service/user/attempts",
        SERVICE.HISTORY
      );
      console.log("User attempts:" + response.data.attempts);
      const attempts = response.data.attempts;
      setUserAttempts(attempts);
    } catch (error: any) {
      console.error("Error getting user attempts:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the data when the component mounts
  useEffect(() => {
    getUserAttempts();
  }, []);

  return (
    <>
      <section>
        <Container mt={"4rem"}>
          <Group>
            <Avatar
              size="8rem"
              name={user?.displayName}
              color="initials"
            ></Avatar>
            <Stack ml={12} flex={1}>
              <Title> {user?.displayName} </Title>
              <Text> {user?.email}</Text>
            </Stack>
            <Center>
              <Button component={Link} to="/session/create" variant="filled">
                Start a session
              </Button>
            </Center>
          </Group>
        </Container>
      </section>
      <section>
        <Container mt="4rem">
          <Box>
            <Flex
              className={classes["question-list"]}
              justify={"center"}
              align={"center"}
            >
              {userAttempts.length > 0 ? (
                userAttempts.map((attempt, key) => (
                  <AttemptCard
                    key={key}
                    attempt={attempt}
                    question={attempt.question}
                    difficulty={attempt.question.difficulty}
                    roomId={attempt.roomId}
                  />
                ))
              ) : !isLoading ? (
                <Center style={{ flexDirection: "column", padding: "2rem" }}>
                  <IconClipboardCheck size={64} color="gray" />
                  <Text size="lg" color="dimmed" mt="md">
                    You have not completed any questions yet!
                  </Text>
                  <Button
                    mt="lg"
                    component={Link}
                    to="/session/create"
                    variant="light"
                  >
                    Start a session
                  </Button>
                </Center>
              ) : (
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "20rem",
                    width: "100%",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  <Center>
                    <Loader size={50} />
                  </Center>
                  <Center>Loading your attempts...</Center>
                </Box>
              )}
            </Flex>
          </Box>
        </Container>
      </section>
    </>
  );
}
