import { forwardRef } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { Group, Avatar, Text, Menu, UnstyledButton } from "@mantine/core";

interface UserButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  image: string;
  name: string;
  email: string;
  color: string;
  icon?: React.ReactNode;
}

const AvatarWithDetailsButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ image, name, email, icon, color, ...others }: UserButtonProps, ref) => (
    <UnstyledButton
      ref={ref}
      style={{
        // padding: "var(--mantine-spacing-md)",
        color: "var(--mantine-color-text)",
        borderRadius: "var(--mantine-radius-sm)",
      }}
      {...others}
    >
      <Group>
        <Avatar src={image} radius="xl" name={name} color={color} />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {name}
          </Text>

          <Text c="dimmed" size="xs">
            {email}
          </Text>
        </div>

        {icon === null ? <></> : <IconChevronRight size="1rem" />}
      </Group>
    </UnstyledButton>
  )
);

export default AvatarWithDetailsButton;
