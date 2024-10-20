import { Box, Button, Center, useMantineColorScheme } from "@mantine/core";

import classes from "./AlertBox.module.css";

type AlertType = "error" | "warning" | "info" | "success";

export default function AlertBox({
  children,
  type,
}: {
  children: React.ReactNode;
  type: AlertType;
}) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <Box className={`${classes.container} ${classes[type]}`}>
      {/* <Button onClick={() => setColorScheme("light")}></Button>
      <Button onClick={() => setColorScheme("dark")}></Button> */}
      <Center>{children}</Center>
    </Box>
  );
}
