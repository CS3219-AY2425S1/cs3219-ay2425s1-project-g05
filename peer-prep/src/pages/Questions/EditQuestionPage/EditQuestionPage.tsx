import { useNavigate, useParams } from "react-router-dom";
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
import {
  CategoryResponseData,
  Question,
  QuestionResponseData,
  TestCase,
} from "../../../types/question";
import useApi, { SERVICE, ServerResponse } from "../../../hooks/useApi";
import { notifications } from "@mantine/notifications";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [solution, setSolution] = useState("");
  const [link, setLink] = useState("");

  const [fetchedCategories, setFetchedCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const navigate = useNavigate();

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
      const response = await fetchData<ServerResponse<QuestionResponseData>>(
        `/question-service/id/${questionId}`,
        SERVICE.QUESTION
      );

      const question = response.data.question;
      setName(question.title);
      setDifficulty(question.difficulty);
      setCategories(question.categories);
      setDescription(question.description.testDescription);
      setTestCases(question.testCases);
      setSolution(question.solutionCode);
      setLink(question.link);
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
      const response = await fetchData<ServerResponse<CategoryResponseData>>(
        "/question-service/categories",
        SERVICE.QUESTION
      );

      const categories = response.data.categories;
      const transformedCategories = categories.map((category: string) => ({
        value: category.toUpperCase(),
        label:
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
      }));
      setFetchedCategories(transformedCategories);
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
      const response = await fetchData<ServerResponse<QuestionResponseData>>(
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
            solutionCode: solution,
            link,
          }),
        }
      );

      const createdQuestion = response.data.question;

      notifications.show({
        message: "Question updated successfully!",
        color: "green",
      });
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
      const response = await fetchData<ServerResponse<Question>>(
        `/question-service/id/${id}`,
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
        <Textarea
          label={"Solution"}
          value={solution}
          onChange={(event) => setSolution(event.currentTarget.value)}
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
        <TextInput
          label="Link to question (e.g. Leetcode)"
          value={link}
          onChange={(event) => setLink(event.currentTarget.value)}
          required
        />
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
