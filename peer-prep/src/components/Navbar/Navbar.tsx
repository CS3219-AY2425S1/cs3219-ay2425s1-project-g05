import {
  Group,
  Button,
  UnstyledButton,
  Text,
  ThemeIcon,
  Divider,
  Box,
  Burger,
  Drawer,
  Collapse,
  ScrollArea,
  rem,
  useMantineTheme,
  Menu,
  Flex,
  ActionIcon,
  useMantineColorScheme,
  Space,
} from "@mantine/core";
// import { MantineLogo } from "@mantinex/mantine-logo";
import { useDisclosure } from "@mantine/hooks";
import {
  IconNotification,
  IconCode,
  IconBook,
  IconChartPie3,
  IconFingerprint,
  IconCoin,
  IconChevronDown,
  IconArrowsLeftRight,
  IconMessageCircle,
  IconPhoto,
  IconSearch,
  IconSettings,
  IconTrash,
  IconLogout,
  IconHome,
  IconSun,
  IconMoon,
  IconRefresh,
} from "@tabler/icons-react";
import classes from "./Navbar.module.css";
import { Link, useLocation } from "react-router-dom";
import { AUTH_STATUS, useAuth } from "../../hooks/useAuth";
import AvatarWithDetailsButton from "../AvatarIcon/AvatarWithDetailsButton";
import { useId } from "react";

export function Navbar() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const theme = useMantineTheme();

  const { user, logout, authStatus } = useAuth();

  const { toggleColorScheme, colorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  return (
    <Box pb="sm">
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          {/* <MantineLogo size={30} /> */}
          <Box className={classes.icon}> 🫂 PeerPrep</Box>

          <Group
            h="100%"
            gap={0}
            visibleFrom="sm"
            className={classes.linkContainer}
          >
            <Link
              to={authStatus === AUTH_STATUS.LOGGED_IN ? "/dashboard" : "/"}
              className={classes.link}
            >
              Home
            </Link>

            {/* <HoverCard
              width={600}
              position="bottom"
              radius="md"
              shadow="md"
              withinPortal
            >
              <HoverCard.Target>
                <a href="#" className={classes.link}>
                  <Center inline>
                    <Box component="span" mr={5}>
                      Features
                    </Box>
                    <IconChevronDown
                      style={{ width: rem(16), height: rem(16) }}
                      color={theme.colors.blue[6]}
                    />
                  </Center>
                </a>
              </HoverCard.Target>

              <HoverCard.Dropdown style={{ overflow: "hidden" }}>
                <Group justify="space-between" px="md">
                  <Text fw={500}>Features</Text>
                  <Anchor href="#" fz="xs">
                    View all
                  </Anchor>
                </Group>

                <Divider my="sm" />

                <SimpleGrid cols={2} spacing={0}>
                  {links}
                </SimpleGrid>

                <div className={classes.dropdownFooter}>
                  <Group justify="space-between">
                    <div>
                      <Text fw={500} fz="sm">
                        Get started
                      </Text>
                      <Text size="xs" c="dimmed">
                        Their food sources have decreased, and their numbers
                      </Text>
                    </div>
                    <Button variant="default">Get started</Button>
                  </Group>
                </div>
              </HoverCard.Dropdown>
            </HoverCard> */}

            {user ? (
              user.isAdmin ? (
                <Link to="/questions" className={classes.link}>
                  Questions
                </Link>
              ) : null
            ) : null}
          </Group>
          <Flex className={classes.authContainer}>
            {user ? (
              <Group gap="1.5rem">
                <ActionIcon
                  variant="transparent"
                  aria-label="Settings"
                  color="grey"
                  onClick={toggleColorScheme}
                >
                  {colorScheme === "dark" ? (
                    <IconSun
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  ) : (
                    <IconMoon
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <AvatarWithDetailsButton
                      image=""
                      name={user.displayName}
                      email={user.email}
                      color="initials"
                    >
                      {user.displayName}
                    </AvatarWithDetailsButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Application</Menu.Label>
                    <Menu.Item
                      leftSection={
                        <IconHome style={{ width: rem(14), height: rem(14) }} />
                      }
                    >
                      <Link style={{ textDecoration: "none" }} to="/dashboard">
                        Dashboard
                      </Link>
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item
                      leftSection={
                        <IconRefresh
                          style={{ width: rem(14), height: rem(14) }}
                        />
                      }
                      // onClick={logout}
                    >
                      Change password
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={
                        <IconLogout
                          style={{ width: rem(14), height: rem(14) }}
                        />
                      }
                      onClick={logout}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>{" "}
              </Group>
            ) : (
              <Group visibleFrom="sm" gap="1.5rem">
                <ActionIcon
                  variant="transparent"
                  aria-label="Settings"
                  color="grey"
                  onClick={toggleColorScheme}
                >
                  {colorScheme === "dark" ? (
                    <IconSun
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  ) : (
                    <IconMoon
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
                <Group>
                  <Link to="/login">
                    <Button variant="default">Log in</Button>
                  </Link>
                  <Link to="/login?register=true">
                    <Button variant="filled">Sign up</Button>
                  </Link>
                </Group>
              </Group>
            )}
          </Flex>

          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="sm"
          />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />

          <Link
            to={authStatus === AUTH_STATUS.LOGGED_IN ? "/dashboard" : "/"}
            className={classes.link}
            onClick={closeDrawer}
          >
            Home
          </Link>
          {user ? (
            user.isAdmin ? (
              <Link
                to="/questions"
                className={classes.link}
                onClick={closeDrawer}
              >
                Questions
              </Link>
            ) : null
          ) : null}

          <Divider my="sm" />
          {user && (
            <>
              <Link
                className={classes.link}
                to="/dashboard"
                onClick={closeDrawer}
              >
                Dashboard
              </Link>
              <Link className={classes.link} to="#" onClick={closeDrawer}>
                Change password
              </Link>
            </>
          )}
          <Divider my="sm" />
          <Box className={classes.mobileNavbarFooter}>
            {user ? (
              <>
                <AvatarWithDetailsButton
                  image=""
                  name={user.displayName}
                  email={user.email}
                  color="initials"
                  icon={null}
                >
                  {user.displayName}
                </AvatarWithDetailsButton>
                <Space flex={1} />
                <ActionIcon
                  variant="transparent"
                  aria-label="Settings"
                  color="grey"
                  onClick={toggleColorScheme}
                >
                  {colorScheme === "dark" ? (
                    <IconSun
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  ) : (
                    <IconMoon
                      // style={{ width: "70%", height: "70%" }}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
                <Button
                  color="red"
                  leftSection={
                    <IconLogout style={{ width: rem(14), height: rem(14) }} />
                  }
                  onClick={() => {
                    closeDrawer();
                    logout();
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Space flex={1} />
                <Group>
                  <Link to="/login">
                    <Button variant="default" onClick={closeDrawer}>
                      Log in
                    </Button>
                  </Link>
                  <Link to="/login?register=true">
                    <Button variant="filled" onClick={closeDrawer}>
                      Sign up
                    </Button>
                  </Link>
                </Group>
              </>
            )}
          </Box>

          <Divider my="sm" />

          <Group>
            <Space flex={1} />
          </Group>

          {/* <Group justify="center" grow pb="xl" px="md">
            <Link to="/login">
              <Button variant="default">Log in</Button>
            </Link>
            <Button>Sign up</Button>
          </Group> */}
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
