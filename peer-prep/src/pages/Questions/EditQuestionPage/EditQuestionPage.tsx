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
  Stack,
  Flex,
  Switch,
  Card,
  Center,
  Divider,
  Space,
  Box,
  Group,
  Modal,
} from "@mantine/core";
import RichTextEditor from "../../../components/Questions/RichTextEditor/RichTextEditor";
import CodeEditorWithLanguageSelector from "../../../components/Questions/LanguageSelector/LanguageSelector";

import classes from "./EditQuestionPage.module.css";
import {
  CategoryResponseData,
  Question,
  QuestionResponseData,
  TestCase,
} from "../../../types/question";
import useApi, { SERVICE, ServerResponse } from "../../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { convertToCombinedCategoryId } from "../../../utils/utils";

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [categoriesIdString, setCategoriesIdString] = useState<string[]>([]);
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [descriptionHtml, setDescriptionHtml] = useState<string>("");
  const [solution, setSolution] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [link, setLink] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // For now, to be changed once backend sends over fixed categories
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
      fetchCategories().then(() => {
        fetchQuestionDetails(id);
      });
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
      setCategoriesIdString(question.categoriesId.map(String));
      setDescriptionText(question.description.descriptionText);
      setDescriptionHtml(question.description.descriptionHtml);
      setTemplateCode(question.templateCode);
      setSolution(question.solutionCode);
      setLink(question.link);
      setTestCases(question.testCases);
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
      setFetchedCategories(transformedCategories);

      return true;
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

    console.log(`NOTE: ${categoriesIdString} << selected categories`);
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
            description: { descriptionText, descriptionHtml },
            categoriesId: categoriesIdString.map(Number),
            difficulty,
            solutionCode: solution,
            templateCode,
            link,
            testCases: updatedTestCases,
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

  const [opened, { open, close }] = useDisclosure(false);

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

  const canSubmit =
    name &&
    difficulty &&
    categoriesIdString.length &&
    descriptionText &&
    descriptionHtml &&
    solution &&
    link &&
    testCases.length;

  return (
    <Container mt={48}>
      <Modal opened={opened} onClose={close} title="Confirm deletion" centered>
        <Stack>
          <Box py="lg">Are you sure you want to delete this question?</Box>
          <Divider />
          <Group justify="end">
            <Button size="sm" variant="subtle" color="gray" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" color="red" onClick={() => handleDelete()}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
      <h1>Edit Question</h1>
      <form onSubmit={handleSubmit}>
        <TextInput
          mt={8}
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          required
        />
        <Select
          mt={8}
          label="Difficulty"
          value={difficulty}
          onChange={(value: string | null) => setDifficulty(value)}
          data={difficultyOptions}
          required
        />
        <MultiSelect
          mt={8}
          label="Categories"
          value={categoriesIdString}
          onChange={(value: string[]) => setCategoriesIdString(value)}
          data={fetchedCategories}
          multiple
          required
        />

        <Space h="8" />
        <RichTextEditor
          content={descriptionHtml}
          onContentChange={(textValue: string, htmlvalue: string) => {
            setDescriptionText(textValue);
            setDescriptionHtml(htmlvalue);
          }}
        />

        <Space h="12" />
        <CodeEditorWithLanguageSelector
          label="Solution Code"
          code={solution}
          onCodeChange={setSolution}
          required={true}
        />

        <Space h="12" />
        <CodeEditorWithLanguageSelector
          label="Template Code"
          code={templateCode}
          onCodeChange={setTemplateCode}
          required={false}
        />

        <TextInput
          mt={12}
          label="Link to question (e.g. Leetcode)"
          value={link}
          onChange={(event) => setLink(event.currentTarget.value)}
          required
        />

        <Flex style={{ alignItems: "baseline", gap: 4 }} mt={8}>
          <Text className={classes.testCaseHeader}>Test Cases</Text>
          <Text style={{ color: "red" }}>*</Text>
        </Flex>

        <Stack>
          {testCases.map((testCase, index) => (
            <Card key={index} shadow="sm" padding="lg" radius="md">
              <CodeEditorWithLanguageSelector
                label={`Test Code ${index + 1}`}
                code={testCase.testCode}
                onCodeChange={(value) =>
                  handleTestCaseChange(index, "testCode", value)
                }
                required={false}
                height="130px"
              />
              <Textarea
                mt={8}
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
                <Button
                  color="red"
                  variant="light"
                  onClick={() => removeTestCase(index)}
                >
                  Remove Test Case
                </Button>
              </Flex>
            </Card>
          ))}
          <Flex justify={"right"}>
            <Button variant="light" onClick={addTestCase}>
              Add Test Case
            </Button>
          </Flex>
        </Stack>

        <Divider my="md" />

        <Center mb={"4rem"}>
          <Button type="submit" disabled={!canSubmit}>
            Update Question
          </Button>
          <Space w="1rem" />
          <Button type="button" color="red" onClick={open}>
            Delete Question
          </Button>
        </Center>
      </form>
    </Container>
  );
}
