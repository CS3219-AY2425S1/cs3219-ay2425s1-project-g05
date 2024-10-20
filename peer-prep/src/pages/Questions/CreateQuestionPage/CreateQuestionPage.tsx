import { useEffect, useState } from "react";
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Container,
  Stack,
  Center,
  Input,
  Stepper,
  Text,
  MultiSelect,
  Card,
  Switch,
  Flex,
  Divider,
} from "@mantine/core";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import classes from "./CreateQuestionPage.module.css";
import { QuestionResponseData, TestCase } from "../../../types/question";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

export default function CreateQuestionPage() {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>("EASY");
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [solution, setSolution] = useState("");
  const [link, setLink] = useState("");

  const navigate = useNavigate();

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
    fetchCategories();
  }, []);

  const { fetchData, isLoading, error } = useApi();

  const fetchCategories = async () => {
    try {
      const response = await fetchData<ServerResponse<QuestionResponseData>>(
        "/question-service/categories",
        SERVICE.QUESTION
      );

      const categories = response.data.categories || [];
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
        "/question-service",
        SERVICE.QUESTION,
        {
          method: "POST",
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
      notifications.show({
        message: "Question created successfully!",
        color: "green",
      });

      // Redirect to questions page
      // todo: redirect to the specific qn page
      navigate("/questions", { replace: true });
    } catch (error: any) {
      console.log("Error creating question:", error);
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

  const [active, setActive] = useState(1);

  return (
    <Container mt={48}>
      <h1>Add New Question</h1>
      <form onSubmit={handleSubmit}>
        <Stack>
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
              onChange={setDescription}
              style={{ height: "576px", marginTop: "12px" }}
              modules={{
                toolbar: [
                  "bold",
                  "underline",
                  "italic",
                  "link",
                  "blockquote",
                  "code-block",
                  "image",
                ],
              }}
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
            <Button onClick={addTestCase} style={{ width: "fit-content" }}>
              Add Test Case
            </Button>
          </Stack>

          <Divider my="md" />

          <Center>
            <Button type="submit">Submit</Button>
          </Center>
        </Stack>
      </form>
    </Container>
  );
}
