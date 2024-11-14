import {
  PasswordInput,
  Button,
  Title,
  Text,
  Box,
  Center,
  Progress,
  Flex,
} from "@mantine/core";
import classes from "./ChangePasswordPage.module.css";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import useApi, { SERVICE, ServerResponse } from "../../hooks/useApi";
import { User } from "../../types/user";
import { useNavigate } from "react-router-dom";

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

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newPasswordVisible, { toggle }] = useDisclosure(false);

  const strength = getStrength(newPassword);
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(newPassword)}
    />
  ));

  const canChangePassword = requirements.every((requirement) =>
    requirement.re.test(newPassword)
  );

  const bars = Array(4)
    .fill(0)
    .map((_, index) => (
      <Progress
        key={index}
        value={
          newPassword.length > 0 && index === 0
            ? 100
            : strength >= ((index + 1) / 4) * 100
            ? 100
            : 0
        }
        color={strength > 80 ? "teal" : strength > 50 ? "yellow" : "red"}
        size={4}
        style={{
          flex: 1,
        }}
      />
    ));

  const { fetchData, isLoading } = useApi();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      notifications.show({
        message: "New passwords do not match!",
        color: "red",
      });
      return;
    }

    try {
      // Prepare the request payload
      const requestBody = {
        password: currentPassword,
        newPassword: newPassword,
      };

      // Call the backend using the fetchData hook
      const response = await fetchData<ServerResponse<{ user: User }>>(
        "/user-service/users/changePassword",
        SERVICE.USER,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        false,
        false,
        true
      );

      // Show success message if password change is successful
      notifications.show({
        message: response.message || "Password changed successfully!",
        color: "green",
      });

      // Redirect to the dashboard after successful password change
      navigate("/dashboard", { replace: true });
    } catch (error) {
      // Handle various error messages based on backend responses
      console.error("Error changing password:", error);

      let errorMessage = "Failed to change password.";
      if (error?.statusCode === 400) {
        if (error.message.includes("strength")) {
          errorMessage = "New password does not meet the strength requirement.";
        } else {
          errorMessage = "Please provide valid password details.";
        }
      } else if (error?.statusCode === 401) {
        errorMessage = "Incorrect current password.";
      } else if (error?.statusCode === 404) {
        console.log("User not found");
        errorMessage = "User not found. Please try again.";
      } else if (error?.statusCode === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        console.error("Error updating password:", error);
      }
      notifications.show({
        message: errorMessage,
        color: "red",
      });
    }
  };

  return (
    <Center>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleChangePassword();
        }}
      >
        <Flex className={classes.form}>
          <Title order={2} mb="md">
            Change Your Password
          </Title>

          <PasswordInput
            label="Current Password"
            placeholder="Enter your current password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            mt="md"
            size="md"
            style={{ width: "500px" }}
          />

          <PasswordInput
            label="New Password"
            placeholder="Enter your new password"
            mt="md"
            required
            size="md"
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            value={newPassword}
            style={{ width: "500px" }}
            visible={newPasswordVisible}
            onVisibilityChange={toggle}
          />

          <Box
            mt="xs"
            style={{
              display: "flex",
              gap: "5px",
              width: "100%",
              overflow: "visible",
              maxWidth: "500px",
            }}
          >
            {bars}
          </Box>

          {checks}

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm your new password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            mt="md"
            size="md"
            style={{ width: "500px" }}
            visible={newPasswordVisible}
            onVisibilityChange={toggle}
            error={
              confirmPassword.length > 0 && confirmPassword !== newPassword
            }
          />

          <Button
            fullWidth
            mt="xl"
            size="md"
            type="submit"
            disabled={!canChangePassword}
          >
            Change Password
          </Button>
        </Flex>
      </form>
    </Center>
  );
}
