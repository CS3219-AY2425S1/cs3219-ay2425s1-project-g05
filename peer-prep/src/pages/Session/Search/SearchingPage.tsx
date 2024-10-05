import { Flex, Image, Stack, Text, Title } from "@mantine/core";

import classes from "./SearchingPage.module.css";

import SearchingImage from "../../../assets/searchimage.svg";

export default function SearchingPage() {
  return (
    <>
      <Flex className={classes.searchingWrapper}>
        <Image className={classes.searchingImage} src={SearchingImage} />
        <Title>
          {" "}
          <span className={classes.loadingSpinner}> ⏳ </span> Loading...{" "}
        </Title>
        <Text> You will be matched with a partner soon! </Text>
      </Flex>
    </>
  );
}
