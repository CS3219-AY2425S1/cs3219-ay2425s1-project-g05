import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Group,
  MultiSelect,
  SimpleGrid,
  Stack,
  Title,
} from "@mantine/core";
import classes from "./CreateSessionPage.module.css";
import { useEffect, useState } from "react";
import { capitalizeFirstLetter } from "../../../utils/utils";
import { Link, useLoaderData } from "react-router-dom";
import useApi, { ServerResponse, SERVICE } from "../../../hooks/useApi";
import { CategoryResponseData } from "../../../types/question";

// Arrays
// Algorithms
// Databases
// Data Structures
// Brainteaser
// Strings
// Bit Manipulation
// Recursion

export default function CreateSessionPage() {
  // TODO: query the question service to get a list of categories and difficulties
  const { fetchData } = useApi();
  useEffect(() => {
    fetchData<ServerResponse<CategoryResponseData>>(
      `/question-service/categories`,
      SERVICE.QUESTION
    ).then((data) => {
      const categories = data.data.categories;
      const transformedCategories = categories.map((category: string) => ({
        value: category.toUpperCase(),
        label:
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
      }));

      setCategories(transformedCategories.map((v) => v.value));
    });
  }, []);

  const [categories, setCategories] = useState<string[]>([
    "Arrays",
    "Algorithms",
    "Databases",
    "Data Structures",
    "Brainteaser",
    "Strings",
    "Bit Manipulation",
    "Recursion",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [difficulties, setDifficulties] = useState<string[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );

  const canSearch =
    selectedCategories.length > 0 && selectedDifficulties.length > 0;

  // const data = useLoaderData() as ServerResponse<[string[]]>;

  // useEffect(() => {
  //   console.log("data from preload:", data);
  //   if (data.data) {
  //     setCategories(data.data[0]);
  //   }
  // }, [data]);
  return (
    <>
      <Flex className={classes.wrapper}>
        <Title> Create a session </Title>
        {/* <MultiSelect
          label="Your favorite libraries"
          placeholder="Pick value"
          data={["React", "Angular", "Vue", "Svelte"]}
        /> */}

        <SimpleGrid cols={2}>
          <Stack className={classes.criteria}>
            <Title order={4}> Categories </Title>
            <Checkbox.Group
              defaultValue={[]}
              label="Pick one or more categories to search for"
              description=""
              withAsterisk
              value={selectedCategories}
              onChange={(value) => setSelectedCategories(value)}
            >
              <Stack mt="xs">
                {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
                {categories.map((category, index) => (
                  <Checkbox value={category} label={category} key={index} />
                ))}
              </Stack>
            </Checkbox.Group>
            <Divider />
            <Checkbox
              checked={selectedCategories.length === categories.length}
              indeterminate={
                selectedCategories.length !== categories.length &&
                selectedCategories.length > 0
              }
              label={
                selectedCategories.length > 0
                  ? `${selectedCategories.length} selected`
                  : "Select all"
              }
              onChange={() => {
                // if indeterminate, select all
                // if all selected, deselect all
                // if none selected, select all
                if (selectedCategories.length === categories.length) {
                  setSelectedCategories([]);
                } else {
                  setSelectedCategories(categories);
                }
              }}
            />
          </Stack>
          <Stack className={classes.criteria}>
            <Title order={4}> Difficulties </Title>
            <Checkbox.Group
              defaultValue={[]}
              label="Pick one or more difficulties to search for"
              description=""
              withAsterisk
              value={selectedDifficulties}
              onChange={(value) => setSelectedDifficulties(value)}
            >
              <Stack mt="xs">
                {/* <Checkbox value="react" label="React" />
                <Checkbox value="svelte" label="Svelte" />
                <Checkbox value="ng" label="Angular" />
                <Checkbox value="vue" label="Vue" /> */}
                {difficulties.map((difficulty, index) => (
                  <Checkbox
                    value={difficulty}
                    label={capitalizeFirstLetter(difficulty)}
                    key={index}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
            <Divider />
            <Checkbox
              checked={selectedDifficulties.length === difficulties.length}
              indeterminate={
                selectedDifficulties.length !== difficulties.length &&
                selectedDifficulties.length > 0
              }
              label={
                selectedDifficulties.length > 0
                  ? `${selectedDifficulties.length} selected`
                  : "Select all"
              }
              onChange={() => {
                // if indeterminate, select all
                // if all selected, deselect all
                // if none selected, select all
                if (selectedDifficulties.length === difficulties.length) {
                  setSelectedDifficulties([]);
                } else {
                  setSelectedDifficulties(difficulties);
                }
              }}
            />
          </Stack>
        </SimpleGrid>
        <Button
          component={Link}
          to="/session/search"
          disabled={!canSearch}
          style={{ pointerEvents: !canSearch ? "none" : "unset" }}
        >
          Begin search
        </Button>
      </Flex>
    </>
  );
}
