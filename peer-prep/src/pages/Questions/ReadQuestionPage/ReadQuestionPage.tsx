import { useLoaderData, useNavigate, Link } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { Question } from "../../../types/question";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Group,
  Modal,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import CategoryDisplay from "../../../components/Questions/Category/Category";
import ComplexityDisplay from "../../../components/Questions/Complexity/Complexity";

import classes from "./ReadQuestionPage.module.css";
import StatisticCard from "../../../components/Statistics/StatisticCard";
import {
  IconBrandLeetcode,
  IconEdit,
  IconTrack,
  IconTrash,
} from "@tabler/icons-react";
import { useAuth } from "../../../hooks/useAuth";
import { useDisclosure } from "@mantine/hooks";
import { notifications, useNotifications } from "@mantine/notifications";

export default function ReadQuestionPage() {
  const data = useLoaderData() as ServerResponse<{ question: Question }>;

  const [question, setQuestion] = useState<Question | null>(null);

  const navigate = useNavigate();

  const { fetchData } = useApi();

  const { user } = useAuth();

  const statusCode = data.statusCode;

  useEffect(() => {
    if (statusCode !== 200) {
      navigate("/questions");
    }

    if (data.data) {
      setQuestion(data.data.question);
    }
  }, [statusCode]);

  // for delete confirmation
  const [opened, { open, close }] = useDisclosure(false);

  const handleDelete = async () => {
    try {
      const response = await fetchData<ServerResponse<Question>>(
        `/question-service/id/${question._id}`,
        SERVICE.QUESTION,
        {
          method: "DELETE",
        }
      );

      notifications.show({
        message: "Question deleted successfully!",
        color: "green",
      });

      navigate("/questions", {
        replace: true,
      });
    } catch (error: any) {
      console.error("Error deleting question:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  if (question)
    return (
      <Container
        mt={"xl"}
        className={`${classes[question.difficulty.toLowerCase()]}`}
      >
        <Modal
          opened={opened}
          onClose={close}
          title="Confirm deletion"
          centered
        >
          <Stack>
            <Box py="lg">Are you sure you want to delete this question?</Box>
            <Divider />
            <Group justify="end">
              <Button size="sm" variant="subtle" color="gray" onClick={close}>
                Cancel
              </Button>
              <Button
                size="sm"
                color="red"
                onClick={() => handleDelete()}
                variant="filled"
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>
        <Stack flex={1}>
          {user && user.isAdmin && (
            <Group>
              <Flex flex={1}></Flex>
              <Button
                leftSection={
                  <IconEdit style={{ width: rem(16), height: rem(16) }} />
                }
                size="sm"
                // variant="light"
                component={Link}
                to={`/questions/edit/${question._id}`}
              >
                Edit
              </Button>
              <Button
                leftSection={
                  <IconTrash style={{ width: rem(16), height: rem(16) }} />
                }
                size="sm"
                color="red"
                // variant="light"
                onClick={open}
              >
                Delete
              </Button>
            </Group>
          )}
          <Group className={classes.header}>
            <Title flex={1}> {question.title}</Title>
            <ComplexityDisplay complexity={question.difficulty} />
          </Group>
          <Group>
            <Group flex={1}>
              {(question.categories || []).map((category, index) => (
                <CategoryDisplay key={index} category={category} />
              ))}
            </Group>
            <Group>
              <Button
                color="black"
                size="sm  "
                onClick={() => {
                  window.open(question.link, "_blank", "noopener,noreferrer");
                }}
              >
                <IconBrandLeetcode
                  style={{ width: rem(16), height: rem(16) }}
                />
              </Button>
            </Group>
          </Group>
          <SimpleGrid cols={2}>
            <StatisticCard
              title="Public test cases"
              value={question.testCases.filter((t) => t.isPublic).length}
            />
            <StatisticCard
              title="Private test cases"
              value={question.testCases.filter((t) => !t.isPublic).length}
            />
          </SimpleGrid>

          <div dangerouslySetInnerHTML={{ __html: question.description.descriptionHtml }}></div>

        </Stack>
      </Container>
    );
  else return "Loading...";
}
