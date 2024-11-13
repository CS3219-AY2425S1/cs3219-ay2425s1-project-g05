// This component will be rendered when the user clicks on the "Video call" button.
// It will not be de-rendered until the user clicks on the "End call" button.

import {
  ActionIcon,
  AspectRatio,
  Badge,
  Box,
  Button,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";

import classes from "./VideoChatWidget.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../../../websockets/communication/socket";
import { useAuth } from "../../../hooks/useAuth";
import {
  IconPhone,
  IconPhoneCalling,
  IconPhoneEnd,
  IconPhoneIncoming,
  IconVideo,
} from "@tabler/icons-react";
import { useHover, useViewportSize } from "@mantine/hooks";
import { notifications, useNotifications } from "@mantine/notifications";
import { createPortal } from "react-dom";
import Peer from "peerjs";
const servers: RTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: ["turn:51.79.242.81:3478"],
      username: import.meta.env.VITE_TURN_SERVER_USERNAME,
      credential: import.meta.env.VITE_TURN_SERVER_PASSWORD,
    },
  ],
  iceCandidatePoolSize: 10,
};

type Offer = RTCSessionDescriptionInit;

enum CALL_STATUS {
  IDLE,
  CALLING,
  CONNECTED,
  INCOMING,
}

// same as TextChatWidget
type ChatRoomUser = {
  userId: string;
  userSocketId: string;
  name: string;
  email: string;
};

export default function VideoChatWidget({
  otherUser,
  onVideoCallDisconnect,
  roomId,
}: {
  otherUser?: ChatRoomUser;
  onVideoCallDisconnect: () => void;
  roomId: string;
}) {
  const auth = useAuth();

  const [callStatus, setCallStatus] = useState<CALL_STATUS>(CALL_STATUS.IDLE);
  const callStatusRef = useRef<CALL_STATUS>(CALL_STATUS.IDLE);
  function setCallStatusWrapper(status: CALL_STATUS) {
    callStatusRef.current = status;
    setCallStatus(status);
  }

  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // only when this is populated are we ready to make a call (connection wise)
  const [peerId, setPeerId] = useState(null);
  const [remotePeerIdValue, setRemotePeerIdValue] = useState("");
  const peerInstance = useRef(null);
  const mediaConnection = useRef(null);

  function init() {
    console.log("DEBUG: auth.user", auth.user);
    if (!auth.user) {
      console.log("DEBUG: no auth.user", auth);
      return;
    }
    const peer = new Peer(`${roomId}-${auth.user._id}`, {
      config: servers,
    });

    peer.on("open", (id) => {
      console.log("DEBUG: peer open id set to", id);
      setPeerId(id);
    });

    peer.on("call", async (call) => {
      console.log("DEBUG: call received", call);

      // dont answer if not ready to call
      if (callStatusRef.current !== CALL_STATUS.CALLING) {
        console.log("DEBUG: RECEIVED A CALL, CANNOT ANSWER");

        notifications.show({
          message: `${
            otherUser?.name || "Your partner"
          } is calling you! Go to the chat room to answer the call.`,
          title: "Incoming call",
          color: "cyan",
          autoClose: 10000,
        });

        setCallStatusWrapper(CALL_STATUS.INCOMING);
        return;
      }

      mediaConnection.current = call;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      selfVideoRef.current.srcObject = stream;
      selfVideoRef.current.play();
      selfVideoRef.current.muted = true;
      call.answer(stream);
      call.on("stream", function (remoteStream) {
        setCallStatusWrapper(CALL_STATUS.CONNECTED);
        console.log("DEBUG: remote stream received", remoteStream);
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play();
      });

      call.on("close", () => {
        console.log("DEBUG: call closed in receiver");
        onEndCall();
      });
    });
    peerInstance.current = peer;
  }
  useEffect(() => {
    init();
    return () => {
      peerInstance.current?.destroy();
    };
  }, [auth.user._id]);

  const call = async () => {
    if (!peerInstance.current) init();
    // remote peer id is the user id
    if (callStatusRef.current === CALL_STATUS.IDLE) {
      setCallStatusWrapper(CALL_STATUS.CALLING);
    }

    // call will fail if the other user is not ready to receive the call
    const remotePeerId = `${roomId}-${otherUser?.userId}`;

    console.log("DEBUG: calling", remotePeerId);
    console.log("DEBUG: READY TO CALL");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    selfVideoRef.current.srcObject = stream;
    selfVideoRef.current.play();
    selfVideoRef.current.muted = true;

    const call = peerInstance.current.call(remotePeerId, stream);
    mediaConnection.current = call;
    call.on("stream", (remoteStream) => {
      setCallStatusWrapper(CALL_STATUS.CONNECTED);
      console.log("DEBUG: remote stream received", remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play();
    });

    call.on("close", () => {
      console.log("DEBUG: call closed in caller");
      onEndCall();
    });
  };

  function onEndCall() {
    // cleanup
    setCallStatusWrapper(CALL_STATUS.IDLE);
    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    mediaConnection.current?.close();
    peerInstance.current?.disconnect();
    peerInstance.current?.destroy();
    peerInstance.current = null;

    onVideoCallDisconnect();
  }

  // behaviour of the video chat widget:
  // when waiting for user: show self video
  // when connected: show remote video
  // when mouseover: show self video

  const { hovered, ref: containerRef } = useHover();
  const showSelf = hovered || callStatus === CALL_STATUS.CALLING;

  // when clicked: drag to follow cursor (snap to edges within 16px)

  const [position, setPosition] = useState({ bottom: 8, right: 8 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    setStart({
      x: e.clientX + position.right,
      y: e.clientY + position.bottom,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    setPosition({
      bottom: start.y - e.clientY,
      right: start.x - e.clientX,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);

    // snap bottom to max(bottom, 16) and right to max(right, 16)
    setPosition((prev) => {
      let bottom = Math.max(prev.bottom, 8);
      let right = Math.max(prev.right, 8);

      if (right > window.innerWidth - 8 - 300) {
        right = window.innerWidth - 16 - 300; // account for scrollbar
      }

      if (bottom > window.innerHeight - 8 - 200) {
        bottom = window.innerHeight - 8 - 200;
      }

      return {
        bottom,
        right,
      };
    });

    // if mousex > window.innerWidth - 16, set right to window.innerWidth - 16 - 300 (width of video, fixed)
    // if mousey > window.innerHeight - 16, set bottom to window.innerHeight - 16 - 200 (height of video, fixed)
  };

  // listen to viewport size changes so that we can adjust the position of the video chat widget
  const { height, width } = useViewportSize();

  useEffect(() => {
    handleMouseUp();
  }, [height, width]);

  const [domReady, setDomReady] = useState(false);
  useEffect(() => {
    setDomReady(true);
  }, []);
  return (
    <Box>
      <Group gap="xs">
        {/* <ActionIcon variant="subtle" color="white">
          {" "}
          <IconPhone size={"20px"} />
        </ActionIcon> */}
        {callStatus === CALL_STATUS.CALLING && (
          <Text style={{ color: "white" }}> Waiting for answer... </Text>
        )}
        <ActionIcon
          variant="subtle"
          color="white"
          onClick={callStatus === CALL_STATUS.CONNECTED ? onEndCall : call}
          loading={callStatus === CALL_STATUS.CALLING}
        >
          {callStatus === CALL_STATUS.IDLE ? (
            <Tooltip label="Start a video call">
              <IconPhone size="20px" />
            </Tooltip>
          ) : callStatus === CALL_STATUS.INCOMING ? (
            <Tooltip label="Answer the call">
              <IconPhoneIncoming size="20px" className={classes.shakyButton} />
            </Tooltip>
          ) : (
            <IconPhoneEnd size="20px" />
          )}
        </ActionIcon>
      </Group>

      {/* Portal to outside of the Collapse element */}
      {domReady && (
        <>
          {" "}
          {createPortal(
            <Box
              className={classes.videoContainer}
              ref={containerRef}
              display={callStatus === CALL_STATUS.IDLE ? "none" : "block"}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                bottom: `${position.bottom}px`,
                right: `${position.right}px`,
              }}
            >
              {/* <h1>Video Chat Widget</h1> */}

              <Box
                className={classes.selfVideoContainer}
                key={"self"}
                style={{ display: showSelf ? "block" : "none" }}
              >
                <Text className={classes.selfVideoDescriptor}>
                  {" "}
                  {auth.user.displayName} (You)
                </Text>
                <AspectRatio
                  ratio={1080 / 720}
                  maw={300}
                  mx="auto"
                  className={classes.selfVideo}
                >
                  <video ref={selfVideoRef} autoPlay />
                </AspectRatio>
                <Button
                  size="xs"
                  variant="filled"
                  color="dark"
                  className={classes.selfEndCallButton}
                  onClick={onEndCall}
                >
                  {" "}
                  End call{" "}
                </Button>
              </Box>

              <Box
                className={classes.otherVideoContainer}
                key="other"
                style={{ display: !showSelf ? "block" : "none" }}
              >
                <Text className={classes.otherVideoDescriptor}>
                  {" "}
                  {otherUser?.name}
                </Text>
                <AspectRatio
                  ratio={1080 / 720}
                  maw={300}
                  mx="auto"
                  className={classes.otherVideo}
                >
                  <video ref={remoteVideoRef} autoPlay />
                </AspectRatio>
                <Button
                  size="xs"
                  variant="filled"
                  color="dark"
                  className={classes.otherEndCallButton}
                  onClick={onEndCall}
                >
                  {" "}
                  End call{" "}
                </Button>
              </Box>
            </Box>,
            document.getElementById("video-chat-widget")
          )}
          {callStatus === CALL_STATUS.INCOMING &&
            createPortal(
              <Badge variant="filled" color="yellow" radius="xs">
                INCOMING CALL
              </Badge>,
              document.getElementById("video-call-incoming")
            )}
        </>
      )}
    </Box>
  );
}
