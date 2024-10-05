import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  TextInput,
  Select,
  Textarea,
  Text,
  Button,
  Container,
  MultiSelect,
  Input,
  Stack,
  Flex,
  Switch,
  Card,
  Center,
  Divider,
} from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import classes from "./EditQuestionPage.module.css";
import { Question, QuestionOlsd, TestCase } from "../../../types/question";
import useApi, { QuestionServerResponse, SERVICE } from "../../../hooks/useApi";
import { notifications } from "@mantine/notifications";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [fetchedCategories, setFetchedCategories] = useState<
    { value: string; label: string }[]
  >([]);

  // Mapping for difficulty display
  const difficultyOptions = [
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
  ];

  useEffect(() => {
    if (typeof id === "string") {
      fetchQuestionDetails(id);
      fetchCategories();
    }
  }, [id]);

  const { fetchData, isLoading, error } = useApi();

  const fetchQuestionDetails = async (questionId: string) => {
    try {
      const response = await fetchData<QuestionServerResponse<Question>>(
        `/question-service/id/${questionId}`,
        SERVICE.QUESTION
      );

      if (response.success) {
        const question = response.data;
        setName(question.title);
        setDifficulty(question.difficulty);
        setCategories(question.categories);
        setDescription(question.description.testDescription);
        setTestCases(question.testCases);
      } else {
        notifications.show({
          message:
            response.message ||
            "Error fetching question details, please try again later.",
          color: "red",
        });
      }
    } catch (error: any) {
      console.error("Error fetching question details:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<QuestionServerResponse<string[]>>(
        "/question-service/categories",
        SERVICE.QUESTION
      );

      if (response.success) {
        const categories = response.data;
        const transformedCategories = categories.map((category: string) => ({
          value: category.toUpperCase(),
          label:
            category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
        }));
        setFetchedCategories(transformedCategories);
      } else {
        notifications.show({
          message:
            response.message ||
            "Error fetching categories, please try again later.",
          color: "red",
        });
      }
    } catch (error: any) {
      console.error("Error fetching categories", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Remove _id from test cases
    const updatedTestCases = testCases.map(({ _id, ...rest }) => ({
      ...rest,
    }));

    try {
      const response = await fetchData<QuestionServerResponse<Question>>(
        `/question-service/id/${id}`,
        SERVICE.QUESTION,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: name,
            description: { testDescription: description },
            categories,
            difficulty,
            testCases: updatedTestCases,
          }),
        }
      );

      if (response.success) {
        notifications.show({
          message: "Question updated successfully!",
          color: "green",
        });
      } else {
        notifications.show({
          message:
            response.message ||
            "Error updating question, please try again later.",
          color: "red",
        });
      }
    } catch (error: any) {
      console.error("Error updating question:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetchData<QuestionServerResponse<Question>>(
        `/question-service/id/${id}`,
        SERVICE.QUESTION,
        {
          method: "DELETE",
        }
      );

      if (response.success) {
        notifications.show({
          message: "Question deleted successfully!",
          color: "green",
        });
        window.location.href = "/questions";
      } else {
        notifications.show({
          message:
            response.message ||
            "Error deleting question, please try again later.",
          color: "red",
        });
      }
    } catch (error: any) {
      console.error("Error deleting question:", error);
      notifications.show({
        message: error.message,
        color: "red",
      });
    }
  };

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { testCode: "", isPublic: false, meta: {}, expectedOutput: "" },
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (
    index: number,
    field: keyof TestCase,
    value: any
  ) => {
    const updatedTestCases = [...testCases];
    // @ts-ignore
    updatedTestCases[index][field] = value;
    setTestCases(updatedTestCases);
  };

  return (
    <Container mt={48}>
      <h1>Edit Question</h1>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(value: string | null) => setDifficulty(value)}
          data={difficultyOptions}
          required
        />
        <MultiSelect
          label="Categories"
          value={categories}
          onChange={(value: string[]) => setCategories(value)}
          data={fetchedCategories}
          multiple
          required
        />
        <Textarea
          label={"Description"}
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          minRows={8}
          required
        />

        {/* <Input.Wrapper label="Description" required>
          <ReactQuill
            theme="snow"
            value={description}
            onChange={newDescription => setDescription(newDescription)}
            style={{ height: "576px", marginTop: "12px" }}
            modules={ modules }
          >
            <div className={classes.quillEditor} />
          </ReactQuill>
        </Input.Wrapper> */}

        <Flex style={{ alignItems: "baseline", gap: 4 }}>
          <Text className={classes.testCaseHeader}>Test Cases</Text>
          <Text style={{ color: "red" }}>*</Text>
        </Flex>

        <Stack>
          {testCases.map((testCase, index) => (
            <Card key={index} shadow="sm" padding="lg" radius="md">
              <Textarea
                label={`Test Code ${index + 1}`}
                value={testCase.testCode}
                onChange={(event) =>
                  handleTestCaseChange(
                    index,
                    "testCode",
                    event.currentTarget.value
                  )
                }
                minRows={8}
                required
              />
              <Textarea
                label={`Expected Output ${index + 1}`}
                value={testCase.expectedOutput}
                onChange={(event) =>
                  handleTestCaseChange(
                    index,
                    "expectedOutput",
                    event.currentTarget.value
                  )
                }
                minRows={8}
                required
              />
              <Flex
                justify="space-between"
                align="center"
                style={{ paddingTop: 12 }}
              >
                <Switch
                  label={"Public Test Case"}
                  checked={testCase.isPublic}
                  onChange={(event) =>
                    handleTestCaseChange(
                      index,
                      "isPublic",
                      event.currentTarget.checked
                    )
                  }
                />
                <Button color="red" onClick={() => removeTestCase(index)}>
                  Remove Test Case
                </Button>
              </Flex>
            </Card>
          ))}
          <Button
            onClick={addTestCase}
            style={{ width: "fit-content", marginTop: "8px" }}
          >
            Add Test Case
          </Button>
        </Stack>

        <Divider my="md" />

        <Center>
          <Button type="submit" style={{ marginTop: "12px" }}>
            Update Question
          </Button>
          <Button
            type="button"
            style={{
              marginTop: "12px",
              marginLeft: "8px",
              backgroundColor: "red",
            }}
            onClick={handleDelete}
          >
            Delete Question
          </Button>
        </Center>
      </form>
    </Container>
  );
}
