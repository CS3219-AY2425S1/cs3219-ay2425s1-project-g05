import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { QuestionOlsd } from "../../../types/question";

import classes from "./QuestionCard.module.css";
import ComplexityDisplay from "../Complexity/Complexity";
import { IconBrandLeetcode } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import CategoryDisplay from "../Category/Category";

interface QuestionCardProps {
  question: QuestionOlsd | any;
  isClickable?: boolean; // New prop to control click behavior
}

export default function QuestionCard({
  question,
  isClickable = false, // Default to false
}: QuestionCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (isClickable) {
      navigate(`/questions/edit/${question._id}`);
    }
  }

  return (
    <Box className={classes.card} onClick={handleCardClick}>
      <Stack className={classes.contents}>
        <Title order={3} className={classes.title}>
          {question.title}
        </Title>
        <Text className={classes.description}>
          {question.description.testDescription }
        </Text>
        <Flex gap={"md"} justify={"end"}>
          {question.categories.map((category, index) => (
            <CategoryDisplay key={index} category={category} />
          ))}
        </Flex>
        <Divider />
        <Flex justify={"space-between"} align={"center"}>
          <ComplexityDisplay complexity={question.difficulty} /> 
          <Button
            color="black"
            size="compact-md"
            onClick={() => {
              window.open(question.link, "_blank", "noopener,noreferrer");
            }}
          >
            <IconBrandLeetcode style={{ width: rem(16), height: rem(16) }} />
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
