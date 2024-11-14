import { useEffect, useState } from "react";
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Container,
  Stack,
  Center,
  Text,
  MultiSelect,
  Card,
  Switch,
  Flex,
  Divider,
  Space,
} from "@mantine/core";

import classes from "./CreateQuestionPage.module.css";
import {
  CategoryResponseData,
  QuestionResponseData,
  TestCase,
} from "../../../types/question";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import CodeEditorWithLanguageSelector from "../../../components/Questions/CodeEditor/CodeEditor";
import RichTextEditor from "../../../components/Questions/RichTextEditor/RichTextEditor";
import { convertToCombinedCategoryId } from "../../../utils/utils";

export default function CreateQuestionPage() {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>("EASY");

  // remember to convert back into numbers
  const [categoriesIdString, setCategoriesIdString] = useState<string[]>([]);
  const [descriptionText, setDescriptionText] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [solution, setSolution] = useState(
    "# Please provide your solution code here \n"
  );
  const [templateCode, setTemplateCode] = useState(
    "# Please provide your template code here \n"
  );
  const [link, setLink] = useState("");

  const navigate = useNavigate();

  // For now, to be changed once backend sends over fixed categories
  // const dummyCategories = [
  //   { value: "ARRAYS", label: "Arrays" },
  //   { value: "ALGORITHMS", label: "Algorithms" },
  //   { value: "DATABASES", label: "Databases" },
  //   { value: "DATA STRUCTURES", label: "Data Structures" },
  //   { value: "BRAINTEASER", label: "Brainteaser" },
  //   { value: "STRINGS", label: "Strings" },
  //   { value: "BIT MANIPULATION", label: "Bit Manipulation" },
  //   { value: "RECURSION", label: "Recursion" },
  // ];

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
    // to be uncommented once backend sends over fixed categories
    fetchCategories();
    addTestCase();
  }, []);

  const { fetchData, isLoading, error } = useApi();

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
            description: { descriptionText, descriptionHtml },
            categoriesId: categoriesIdString.map(Number),
            difficulty,
            testCases: updatedTestCases,
            solutionCode: solution,
            templateCode,
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
      {
        testCode: "",
        isPublic: false,
        meta: {},
        expectedOutput: "",
        input: "",
      },
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
      <h1>Add New Question</h1>
      <form onSubmit={handleSubmit}>
        <TextInput
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
          required={true}
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
              <Textarea
                mt={8}
                label={`Input`}
                value={testCase.input}
                onChange={(event) =>
                  handleTestCaseChange(
                    index,
                    "input",
                    event.currentTarget.value
                  )
                }
                minRows={8}
                required={true}
              />
              <CodeEditorWithLanguageSelector
                label={`Test Code ${index + 1}`}
                code={testCase.testCode}
                onCodeChange={(value) =>
                  handleTestCaseChange(index, "testCode", value)
                }
                required={true}
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
                  onClick={() => removeTestCase(index)}
                  variant="light"
                >
                  Remove Test Case
                </Button>
              </Flex>
            </Card>
          ))}
          <Button
            onClick={addTestCase}
            style={{ width: "fit-content" }}
            variant="light"
          >
            Add Test Case
          </Button>
        </Stack>

        <Divider my="md" />

        <Center mb={"4rem"}>
          <Button type="submit" disabled={!canSubmit} variant="filled">
            Submit
          </Button>
        </Center>
      </form>
    </Container>
  );
}
