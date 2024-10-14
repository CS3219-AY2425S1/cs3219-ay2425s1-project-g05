import {
  Box,
  CloseButton,
  Container,
  Flex,
  Input,
  Stack,
  Button,
  Modal,
  TextInput,
  Select,
  Textarea,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Question, SAMPLE_QUESTIONS } from "../../types/question";
import useApi, { ServerResponse } from "../../hooks/useApi";
import { Link, useLoaderData } from "react-router-dom";
import QuestionCard from "../../components/Questions/QuestionCard/QuestionCard";

import classes from "./QuestionPage.module.css";

export default function QuestionPage() {
  const [searchValue, setSearchValue] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  interface QuestionResponse {
    questions: Question[];
  }

  // const { isLoading, error, fetchData } = useApi();
  const data = useLoaderData() as ServerResponse<QuestionResponse>;
  console.log({ data });

  useEffect(() => {
    if (data.data) setQuestions(data.data.questions);
  }, [data]);

  return (
    <>
      <Container mt={48}>
        <Stack>
          <Input
            size="xl"
            placeholder="Search for a question..."
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(event) => setSearchValue(event.currentTarget.value)}
            rightSection={
              <CloseButton
                aria-label="Clear input"
                onClick={() => setSearchValue("")}
                style={{ display: searchValue ? undefined : "none" }}
              />
            }
          />
        </Stack>
      </Container>

      <Container mt={16}>
        {/* <Button component="a" href="/questions/create">
          Add New Question
        </Button> */}
        <Button component={Link} to="/questions/create">
          Add new question
        </Button>
      </Container>

      <Box px={"xl"} mt="4rem" className={classes["question-grid"]}>
        {questions.map((question, key) => (
          <QuestionCard key={key} question={question} isClickable />
        ))}
      </Box>
    </>
  );
}
