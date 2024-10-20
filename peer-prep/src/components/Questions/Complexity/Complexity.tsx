import { Rating } from "@mantine/core";
import { Complexity } from "../../../types/question";

export default function ComplexityDisplay({
  complexity,
}: {
  complexity: Complexity;
}) {
  let rating = 0;
  if (complexity == "EASY") {
    rating = 1;
  } else if (complexity == "MEDIUM") {
    rating = 2;
  } else if (complexity == "HARD") {
    rating = 3;
  }

  return <Rating defaultValue={rating} count={3} readOnly />;
}
