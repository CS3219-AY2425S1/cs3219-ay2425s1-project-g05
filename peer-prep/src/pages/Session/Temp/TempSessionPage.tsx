import { Text } from "@mantine/core";
import { useParams } from "react-router-dom";
import TextChatWidget from "../../../components/Communication/Text/TextChatWidget";

interface TempSessionPageProps {
  roomId: string;
}
export default function TempSessionPage() {
  let { id } = useParams();
  return (
    <div>
      <h1>TempSessionPage</h1>
      <Text> matchId: {id} </Text>

      <TextChatWidget roomId={id} />
    </div>
  );
}
