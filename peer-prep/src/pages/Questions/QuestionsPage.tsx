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
  Group,
  SimpleGrid,
} from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Question, SAMPLE_QUESTIONS } from "../../types/question";
import useApi, { ServerResponse } from "../../hooks/useApi";
import { Link, useLoaderData } from "react-router-dom";
import QuestionCard from "../../components/Questions/QuestionCard/QuestionCard";

import classes from "./QuestionPage.module.css";
import { useDebouncedValue } from "@mantine/hooks";
import StatisticCard from "../../components/Statistics/StatisticCard";

export default function QuestionsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [debounced] = useDebouncedValue(searchValue, 1000);

  const [questions, setQuestions] = useState<Question[]>([]);

  interface QuestionResponse {
    questions: Question[];
  }

  // const { isLoading, error, fetchData } = useApi();
  const data = useLoaderData() as ServerResponse<QuestionResponse>;

  useEffect(() => {
    if (data.data) setQuestions(data.data.questions);
  }, [data]);

  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (debounced.length > 0) {
      const filteredQuestions = questions.filter((question) =>
        question.title.toLowerCase().includes(debounced.toLowerCase())
      );

      setFilteredQuestions(filteredQuestions);
    } else {
      setFilteredQuestions(questions);
    }
  }, [debounced, questions]);

  const categories = [
    ...new Set(questions.flatMap((question) => question.categories)),
  ];

  return (
    <>
      <Container mt={48} mb={48}>
        <Stack>
          <SimpleGrid cols={2} spacing={"xl"}>
            <StatisticCard title="Question count" value={questions.length} />
            <StatisticCard title="Category count" value={categories.length} />
          </SimpleGrid>
          <Group>
            <Input
              flex={1}
              size="lg"
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
            <Button
              component={Link}
              to="/questions/create"
              size="lg"
              leftSection={<IconPlus />}
              variant="filled"
            >
              Add
            </Button>
          </Group>

          <Stack>
            {filteredQuestions.map((question, key) => (
              <QuestionCard
                key={question._id}
                question={question}
                isClickable
                difficulty={question.difficulty}
              />
            ))}
          </Stack>
        </Stack>
      </Container>
      {/* </Box> */}
    </>
  );
}
