import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
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
import TextChatWidget from "../../components/Communication/Text/TextChatWidget";
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <section>
        <Container mt={"4rem"}>
          <Group>
            <Avatar size="8rem" name={user?.displayName}></Avatar>
            <Stack ml={12} flex={1}>
              <Title> {user?.displayName} </Title>
              <Text> {user?.email}</Text>
            </Stack>
            <Center>
              <Button component={Link} to="/session/create">
                Start a session
              </Button>
            </Center>
          </Group>
        </Container>
      </section>
      <section>
        {/* <Container mt="4rem"> */}
        <Box px={"xl"} mt="4rem">
          <Flex className={classes["question-list"]}>
            {SAMPLE_QUESTIONS.map((question, key) => (
              <QuestionCard key={key} question={question} difficulty="EASY" />
            ))}
          </Flex>
        </Box>
        {/* </Container> */}
      </section>
    </>
  );
}
