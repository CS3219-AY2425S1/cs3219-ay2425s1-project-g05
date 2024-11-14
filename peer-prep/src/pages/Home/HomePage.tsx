import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Image,
  rem,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconGauge,
  IconCookie,
  IconUser,
  IconMessage2,
  IconLock,
  IconCircleCheck,
  IconNumber1,
  IconNumber2,
  IconNumber3,
  IconEdit,
} from "@tabler/icons-react";
import classes from "./HomePage.module.css";
import { Link, useNavigate } from "react-router-dom";
import { AUTH_STATUS, useAuth } from "../../hooks/useAuth";
import React, { useEffect } from "react";

import MatchImage from "../../assets/matchimage.svg";

const MOCKDATA = [
  {
    icon: IconGauge,
    title: "Collaboration",
    description:
      "Our live code editor synchronizes all your changes in real-time, so you can see what your partner is typing as they type it",
  },
  {
    icon: IconUser,
    title: "Communication",
    description:
      "We offer various ways to talk to your partner, including video chat, audio chat, and text chat",
  },
  {
    icon: IconCookie,
    title: "Choose your own adventure",
    description:
      "With a large variety of questions and categories, you're able to work on those categories that have been giving you trouble",
  },
  {
    icon: IconEdit,
    title: "Practice makes perfect",
    description:
      "Keep track of the categories that you're struggling in, and maybe even attempt the questions again.",
  },
  // {
  //   icon: IconMessage2,
  //   title: "24/7 Support",
  //   description:
  //     "Rapidash usually can be seen casually cantering in the fields and plains, Skitty is known to chase around after its own tail",
  // },
];

interface FeatureProps {
  icon: React.FC<any>;
  title: React.ReactNode;
  description: React.ReactNode;
}

interface StepProps {
  number: any;
  children: React.ReactNode | React.ReactNode[];
  last?: boolean;
}

export default function Home() {
  // redirect to /dashboard if user is logged in

  const navigate = useNavigate();
  const { user, authStatus } = useAuth();

  useEffect(() => {
    if (authStatus === AUTH_STATUS.LOGGED_IN) {
      navigate("/dashboard");
    }
  }, [authStatus]);

  const steps: StepProps[] = [
    {
      number: 1,
      children: "Choose categories and difficulty",
    },
    {
      number: 2,
      children: "Get matched with a partner",
    },
    {
      number: 3,
      children: "Begin coding!",
    },
    {
      number: "",
      children: (
        <Button
          variant="gradient"
          size="lg"
          gradient={{ from: "cyan", to: "red", deg: 90 }}
          component={Link}
          to="/login"
        >
          {" "}
          Get started{" "}
        </Button>
      ),
      last: true,
    },
  ];

  return (
    <>
      <section>
        <Container size="xl" mt="1.5rem" className={classes.header}>
          <Title className={classes.headerText}>
            {" "}
            <span className={classes.highlight}> PeerPrep </span> is your best
            friend when it comes to acing the coding interview.
          </Title>
          <Text className={classes.subtitleText} c="dimmed">
            Doing LeetCode by yourself is boring. Why not do it with someone?{" "}
          </Text>
        </Container>
      </section>
      <section>
        <Container size="xl" mt="2rem" className={classes.subHeader}>
          <Box className={classes.steps}>{steps.map(StepComponent)}</Box>

          <Image className={classes.image} src={MatchImage} />
        </Container>
      </section>

      <section className={`${classes["header-content"]} ${classes.shaded}`}>
        <Box>
          <Container className={classes.wrapper}>
            <Title className={classes.title}>
              Reduce the boredom and frustration of coding alone
            </Title>

            <Container size={560} p={0}>
              <Text size="sm" className={classes.description}>
                Two heads are better than one. With our collaborative features,
                think about and solve problems with a friend. As the saying
                goes, if you can explain it to someone else, you have mastered
                the category.{" "}
              </Text>
            </Container>

            <SimpleGrid
              mt={60}
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing={{ base: "xl", md: 50 }}
              verticalSpacing={{ base: "xl", md: 50 }}
            >
              {MOCKDATA.map(Feature)}
            </SimpleGrid>
          </Container>
        </Box>
      </section>
    </>
  );
}

export function Feature(
  { icon: Icon, title, description }: FeatureProps,
  index: number
) {
  return (
    <div key={index}>
      <ThemeIcon variant="light" size={40} radius={40}>
        <Icon style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
      </ThemeIcon>
      <Text mt="sm" mb={7}>
        {title}
      </Text>
      <Text size="sm" c="dimmed" lh={1.6}>
        {description}
      </Text>
    </div>
  );
}

export function FeaturesGrid() {
  const features = MOCKDATA.map((feature, index) => (
    <Feature {...feature} key={index} />
  ));

  return (
    <Container className={classes.wrapper}>
      <Title className={classes.title}>
        Integrate effortlessly with any technology stack
      </Title>

      <Container size={560} p={0}>
        <Text size="sm" className={classes.description}>
          Every once in a while, you’ll see a Golbat that’s missing some fangs.
          This happens when hunger drives it to try biting a Steel-type Pokémon.
        </Text>
      </Container>

      <SimpleGrid
        mt={60}
        cols={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: "xl", md: 50 }}
        verticalSpacing={{ base: "xl", md: 50 }}
      >
        {features}
      </SimpleGrid>
    </Container>
  );
}

function StepComponent({ number, children, last }: StepProps, key: number) {
  return (
    <Flex className={classes.step} key={number}>
      <Flex>
        <Flex className={classes.stepIcon}>
          <span className={classes.stepRing}></span>
          {number}
        </Flex>
        <span className={classes.stepText}>{children}</span>
      </Flex>
      {!last && <Box className={classes.stepDivider}></Box>}
    </Flex>
  );
}
