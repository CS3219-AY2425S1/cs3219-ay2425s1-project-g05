import { Paper, Group, ThemeIcon, Text } from "@mantine/core";

import classes from "./StatisticCard.module.css";

interface StatisticCardProps {
  title: string;
  value: number;
  diff?: number;
}

export default function StatisticCard({
  title,
  value,
  diff,
}: StatisticCardProps) {
  return (
    <Paper withBorder p="md" radius="md" key={title}>
      <Group justify="apart">
        <div>
          <Text
            c="dimmed"
            tt="uppercase"
            fw={700}
            fz="xs"
            className={classes.label}
          >
            {title}
          </Text>
          <Text fw={700} fz="xl">
            {value}
          </Text>
        </div>
        {/* <ThemeIcon
          color="gray"
          variant="light"
          style={{
            color:
              stat.diff > 0
                ? "var(--mantine-color-teal-6)"
                : "var(--mantine-color-red-6)",
          }}
          size={38}
          radius="md"
        >
          <DiffIcon size="1.8rem" stroke={1.5} />
        </ThemeIcon> */}
      </Group>
      {/* <Text c="dimmed" fz="sm" mt="md">
        <Text component="span" c={stat.diff > 0 ? "teal" : "red"} fw={700}>
          {stat.diff}%
        </Text>{" "}
        {stat.diff > 0 ? "increase" : "decrease"} compared to last month
      </Text> */}
    </Paper>
  );
}
