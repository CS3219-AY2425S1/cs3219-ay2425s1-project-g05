import {
  Paper,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Title,
  Text,
  Anchor,
  Box,
  Flex,
  Center,
  Stack,
  Image,
  Progress,
  Group,
} from "@mantine/core";
import classes from "./LoginPage.module.css";
import image from "../../assets/loginimage.svg";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { IconCheck, IconX } from "@tabler/icons-react";

function PasswordRequirement({
  meets,
  label,
}: {
  meets: boolean;
  label: string;
}) {
  return (
    <Text component="div" c={meets ? "teal" : "red"} mt={5} size="sm" fw={500}>
      <Center inline>
        {meets ? (
          <IconCheck size="0.9rem" stroke={1.5} />
        ) : (
          <IconX size="0.9rem" stroke={1.5} />
        )}
        <Box ml={7}>{label}</Box>
      </Center>
    </Text>
  );
}

const requirements = [
  { re: /[0-9]/, label: "Includes number" },
  { re: /[a-zA-Z]/, label: "Includes alphabets" },
  { label: "At least 8 characters", re: /.{8,}/ },
];

function getStrength(password: string) {
  let multiplier = password.length > 5 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 0);
}

export default function LoginOrRegisterPage() {
  const [loginMode, setLoginMode] = useState(true); // true = log in, false = register

  const { login, user, register } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  // if register mode from query params, show register form
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const param = searchParams.get("register");
  useEffect(() => {
    if (param) {
      setLoginMode(false);
    } else {
      setLoginMode(true);
    }
  }, [param]);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    // validate

    // call
    login({
      email,
      password,
    });
  };

  const handleRegister = () => {
    // validate

    // call
    setIsLoading(true);
    register({
      email,
      password,
      displayName,
    });
  };

  const strength = getStrength(password);
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(password)}
    />
  ));

  const canRegister = requirements.every((requirement) =>
    requirement.re.test(password)
  );
  const bars = Array(4)
    .fill(0)
    .map((_, index) => (
      <Progress
        styles={{ section: { transitionDuration: "0ms" } }}
        value={
          password.length > 0 && index === 0
            ? 100
            : strength >= ((index + 1) / 4) * 100
            ? 100
            : 0
        }
        color={strength > 80 ? "teal" : strength > 50 ? "yellow" : "red"}
        key={index}
        size={4}
      />
    ));

  function onSubmit() {
    if (loginMode) {
      handleLogin();
    } else {
      handleRegister();
    }
  }

  return (
    // <div className={classes.wrapper}>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Flex>
        <Flex
          flex={1}
          className={classes["left-image-container"]}
          justify={"center"}
          align={"center"}
        >
          <Image
            fit="contain"
            src={image}
            className={classes["left-image"]}
          ></Image>
        </Flex>
        <Flex className={classes.form}>
          <Title
            order={2}
            className={classes.title}
            ta="center"
            mt="md"
            mb={36}
          >
            Welcome {loginMode && "back"} to PeerPrep!
          </Title>

          {!loginMode && (
            <TextInput
              label="Display name"
              placeholder="Your display name"
              size="md"
              required
              onChange={(event) => setDisplayName(event.currentTarget.value)}
              value={displayName}
            />
          )}

          <TextInput
            label="Email address"
            placeholder="hello@gmail.com"
            size="md"
            mt="md"
            required
            onChange={(event) => setEmail(event.currentTarget.value)}
            value={email}
            // email must include an "@"
            pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            mt="md"
            required
            size="md"
            onChange={(event) => setPassword(event.currentTarget.value)}
            value={password}
          />
          {!loginMode && (
            <Group gap={5} grow mt="xs" mb="md">
              {bars}
            </Group>
          )}

          {/* {!loginMode && (
          <PasswordRequirement
            label="Has at least 6 characters"
            meets={password.length > 5}
          />
        )} */}
          {!loginMode && checks}
          <Checkbox label="Keep me logged in" mt="xl" size="md" />
          {loginMode ? (
            <Button fullWidth mt="xl" size="md" type="submit">
              Login
            </Button>
          ) : (
            <Button
              disabled={!canRegister}
              fullWidth
              mt="xl"
              size="md"
              type="submit"
            >
              Register
            </Button>
          )}

          {loginMode ? (
            <Text ta="center" mt="md">
              Don&apos;t have an account?{" "}
              <Anchor<"a">
                href="#"
                fw={700}
                onClick={(event) => {
                  event.preventDefault();
                  setLoginMode(false);
                }}
              >
                Register
              </Anchor>
            </Text>
          ) : (
            <Text ta="center" mt="md">
              Already have an account?{" "}
              <Anchor<"a">
                href="#"
                fw={700}
                onClick={(event) => {
                  event.preventDefault();
                  setLoginMode(true);
                }}
              >
                Login instead
              </Anchor>
            </Text>
          )}
        </Flex>
      </Flex>
    </form>
    // </div>
  );
}
