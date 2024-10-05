import { Box, Text } from "@mantine/core";

import classes from "./Category.module.css";

export default function CategoryDisplay({ category }: { category: string }) {
  // based on the category prop, choose a color based on the first two letters
  // of the category

  return (
    <Box className={classes.category}>
      <Text className={classes["category-text"]}> {category} </Text>
    </Box>
  );
}
