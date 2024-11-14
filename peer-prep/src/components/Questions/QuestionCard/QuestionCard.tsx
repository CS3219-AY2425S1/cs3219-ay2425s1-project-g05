import {
  Badge,
  Blockquote,
  Box,
  Button,
  Collapse,
  Divider,
  Flex,
  Group,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Complexity, Question, QuestionOlsd } from "../../../types/question";

import classes from "./QuestionCard.module.css";
import ComplexityDisplay from "../Complexity/Complexity";
import { IconBrandLeetcode, IconInfoCircle } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import CategoryDisplay from "../Category/Category";
import { memo, useState } from "react";

interface QuestionCardProps {
  question: Question;
  difficulty: Complexity;
  isClickable?: boolean; // New prop to control click behavior
}

const QuestionCard = memo(function QuestionCard({
  question,
  difficulty,
  isClickable = false, // Default to false
}: QuestionCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (isClickable) {
      navigate(`/questions/edit/${question._id}`);
    }
  };

  // convert difficulity to lowercase
  const difficultyString = difficulty.toLowerCase();

  // clamp to a max of 2 categories
  const categories = question.categories.slice(0, 2);
  const hiddenCategoriesSize = question.categories.slice(2).length;

  const [isExpanded, setIsExpanded] = useState(false);

  const hasPrivateTestCases = (question.testCases || []).some(
    (testCase) => !testCase.isPublic
  );

  return (
    // <Box className={classes.card} onClick={handleCardClick}>
    //   <Stack className={classes.contents}>
    //     <Title order={3} className={classes.title}>
    //       {question.title}
    //     </Title>
    //     <Text className={classes.description} lineClamp={3}>
    //       {question.description.testDescription}
    //     </Text>
    //     <Flex gap={"md"} justify={"end"}>
    //       {question.categories.map((category, index) => (
    //         <CategoryDisplay key={index} category={category} />
    //       ))}
    //     </Flex>
    //     <Divider />
    //     <Flex justify={"space-between"} align={"center"}>
    //       <ComplexityDisplay complexity={question.difficulty} />
    //       <Button
    //         color="black"
    //         size="compact-md"
    //         onClick={() => {
    //           window.open(question.link, "_blank", "noopener,noreferrer");
    //         }}
    //       >
    //         <IconBrandLeetcode style={{ width: rem(16), height: rem(16) }} />
    //       </Button>
    //     </Flex>
    //   </Stack>
    // </Box>
    <>
      <Flex
        className={`${classes.accordion} ${classes[difficultyString]} ${
          classes[isExpanded ? "expanded" : "collapsed"]
        }`}
      >
        <Flex
          className={classes.accordionTop}
          onClick={() => setIsExpanded((p) => !p)}
        >
          <Flex className={classes.accordionTopHeader}>
            <Title order={4}>{question.title}</Title>
            {/* <Text lineClamp={2}>{question.description.testDescription} </Text> */}
            <Text lineClamp={2}>{question.description.descriptionText} </Text>
          </Flex>

          <Group className={classes.accordionTopCategories}>
            {categories.map((category, index) => (
              <CategoryDisplay key={index} category={category} />
            ))}
            {hiddenCategoriesSize > 0 ? (
              <CategoryDisplay
                key="extra"
                category={`+${hiddenCategoriesSize}`}
              />
            ) : null}
          </Group>

          <ComplexityDisplay complexity={question.difficulty} />
        </Flex>
        <Collapse in={isExpanded}>
          <Flex className={classes.accordionBody}>
            {/* <SimpleGrid cols={2}> */}
            <Flex>
              <Group className={classes.accordionCategories}>
                {question.categories.map((category, index) => (
                  <CategoryDisplay key={index} category={category} />
                ))}
              </Group>
              <Button component={Link} to={`${question._id}`} variant="light">
                View
              </Button>
            </Flex>

            {hasPrivateTestCases && (
              <Box
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
              >
                <Blockquote color="cyan" icon={<IconInfoCircle />} mt="xl">
                  This question has private test cases!
                </Blockquote>
              </Box>
            )}

            <div dangerouslySetInnerHTML={{ __html: question.description.descriptionHtml }}></div>

            {/* </SimpleGrid> */}
          </Flex>
        </Collapse>
      </Flex>
    </>
  );
});

export default QuestionCard;
