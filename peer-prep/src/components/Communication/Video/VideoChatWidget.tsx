// This component will be rendered when the user clicks on the "Video call" button.
// It will not be de-rendered until the user clicks on the "End call" button.

import {
  ActionIcon,
  AspectRatio,
  Box,
  Button,
  Group,
  Text,
} from "@mantine/core";

import classes from "./VideoChatWidget.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../../../websockets/communication/socket";
import { useAuth } from "../../../hooks/useAuth";
import { IconPhone, IconPhoneEnd, IconVideo } from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPortal } from "react-dom";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

type Offer = RTCSessionDescriptionInit;

enum CALL_STATUS {
  IDLE,
  CALLING,
  CONNECTED,
}

// same as TextChatWidget
type ChatRoomUser = {
  userId: string;
  userSocketId: string;
  name: string;
  email: string;
};

export default function VideoChatWidget({
  roomId,
  otherUser,
  onVideoCallDisconnect,
}: {
  roomId: string;
  otherUser?: ChatRoomUser;
  onVideoCallDisconnect: () => void;
}) {
  const { user } = useAuth();

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(new MediaStream());
  // const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // const [remoteStream, setRemoteStream] = useState<MediaStream | null>(
  //   new MediaStream()
  // );

  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callData, setCallData] = useState<any>(null);
  const [offerCandidates, setOfferCandidates] = useState<RTCIceCandidateInit[]>(
    []
  );
  const [answerCandidates, setAnswerCandidates] = useState<
    RTCIceCandidateInit[]
  >([]);

  const [callStatus, setCallStatus] = useState<CALL_STATUS>(CALL_STATUS.IDLE);

  // let pc = useMemo<RTCPeerConnection | null>(() => null, []);

  let pc = useRef<RTCPeerConnection | null>(null);

  // function onVideoCallDataReceived(data: any) {
  //   setCallData(data);
  // }

  function cleanup() {
    console.log("LOG(VIDEO): Cleaning up");

    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    if (localStream) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (remoteStream) {
      remoteStream.current.getTracks().forEach((track) => track.stop());
    }

    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    socket.off("video-check", onVideoCheck);
    socket.off("video-answer");
    socket.off("video-offer-ice-candidate");
    socket.off("video-answer-ice-candidate");

    onVideoCallDisconnect();
  }

  async function init() {
    console.log("LOG: initializing!");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (!pc.current) pc.current = new RTCPeerConnection(servers);

      console.log("LOG: Got MediaStream:", stream);
      localStream.current = stream;
      localStream.current
        .getTracks()
        .forEach((track) => pc.current.addTrack(track, localStream.current));

      // show stream in HTML video
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = localStream.current;
        selfVideoRef.current.muted = true;
      }

      pc.current.ontrack = (event) => {
        console.log("LOG: ontrack event:", event);
        event.streams[0].getTracks().forEach((track) => {
          console.log("LOG: Adding track to remoteStream:", track);
          if (!remoteStream.current) remoteStream.current = new MediaStream();
          remoteStream.current.addTrack(track);
        });
      };

      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = remoteStream.current;

      pc.current.onconnectionstatechange = (event) => {
        console.log("LOG: onconnectionstatechange event:", event);
        console.log(pc.current.connectionState);
        // alert(" break ! ");
        if (pc.current.connectionState === "connected") {
          console.log("LOG: Connected");

          setCallStatus(CALL_STATUS.CONNECTED);
        }

        if (pc.current.connectionState === "disconnected") {
          // ps: I choose not to listen to video-cleanup event and instead clean up the event automatically.
          // this is better as in the case of no internet, the event will not be received
          socket.emit("video-cleanup", { roomId, selfId: user._id });
          // pc.current.restartIce();

          setCallStatus(CALL_STATUS.IDLE);

          cleanup();
        }
      };

      // listen for response for checking if there is another user in the video call
      socket.on("video-check", onVideoCheck);

      // listen for end call event
      socket.on("video-cleanup", (data: { selfId: string }) => {
        console.log("LOG: receive { video-cleanup } data:", data);

        // cleanup
        cleanup();
      });
    } catch (e) {
      notifications.show({
        message:
          "Please allow camera and microphone access in order to make a video call.",
        title: "Permission Error",
        color: "red",
      });

      throw e;
    }
  }

  useEffect(() => {
    // register the video-check event

    return () => {
      // unregister the video-check event
      socket.off("video-check");
      socket.off("video-answer");
      socket.off("video-offer-ice-candidate");
      socket.off("video-answer-ice-candidate");
      socket.off("video-cleanup");
    };
  }, []);

  async function onCallButtonPress() {
    if (callStatus === CALL_STATUS.CONNECTED) {
      // disconnect
      // emit video-cleanup event
      socket.emit("video-cleanup", { roomId, selfId: user._id });
      cleanup();
    } else {
      try {
        setCallStatus(CALL_STATUS.CALLING);
        // send video-check event to server to check if there is another user in the video call
        // NOTE:TODO: should not allow pressing after connected
        if (!pc.current) await init();
        console.log("LOG: emit { video-check }");
        socket.emit("video-check", { roomId });
      } catch (e) {
        console.log("LOG: Error:", e);
        setCallStatus(CALL_STATUS.IDLE);
      }
    }
  }

  async function onVideoCheck(data: null | { offer: Offer }) {
    console.log("LOG: receive { video-check } data:", data);
    if (data === null) {
      console.log("----------------- WE ARE THE CALLER -----------------");
      // we are the first person in the video call
      // no longer need to listen for video-check event
      socket.off("video-check", onVideoCheck); // precautionary measure only

      // create the offer
      const offerDescription = await pc.current.createOffer({
        iceRestart: true,
      });
      await pc.current.setLocalDescription(offerDescription);
      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      // send the offer to the server
      console.log("LOG: emit { video-offer }");
      socket.emit("video-offer", { offer, roomId });

      // create INTERNAL event listener for onicecandidate
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          offerCandidates.push(event.candidate.toJSON());

          setOfferCandidates((prev) => [...prev, event.candidate.toJSON()]);

          // send candidate to peer
          console.log(
            "LOG: emit { video-offer-ice-candidate } data: ",
            event.candidate.toJSON()
          );
          socket.emit("video-offer-ice-candidate", {
            candidate: event.candidate.toJSON(),
            roomId,
          });
        }
      };

      // create event listener for video-answer
      socket.on(
        "video-answer",
        (data: { answer: RTCSessionDescriptionInit }) => {
          console.log("LOG: receive { video-answer } data:", data);
          if (!pc.current.currentRemoteDescription && data.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current.setRemoteDescription(answerDescription);
          }
        }
      );

      // create event lsitener for video-answer-ice-candidate
      socket.on(
        "video-answer-ice-candidate",
        (data: { candidate: RTCIceCandidateInit }) => {
          console.log(
            "LOG: receive { video-answer-ice-candidate } data:",
            data
          );
          const candidate = new RTCIceCandidate(data.candidate);
          pc.current.addIceCandidate(candidate);
        }
      );
    } else {
      console.log("----------------- WE ARE THE ANSWERER -----------------");
      await pc.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      // send the answer to the server
      socket.emit("video-answer", { answer: answerDescription, roomId });

      // create INTERNAL event listener for onicecandidate
      pc.current.onicecandidate = (event) => {
        console.log("LOG: onicecandidate event:", event);
        if (event.candidate) {
          answerCandidates.push(event.candidate.toJSON());

          setAnswerCandidates((prev) => [...prev, event.candidate.toJSON()]);

          // send candidate to peer
          console.log(
            "LOG: emit { video-answer-ice-candidate } data:",
            event.candidate
          );
          socket.emit("video-answer-ice-candidate", {
            candidate: event.candidate.toJSON(),
            roomId,
          });
        }
      };

      // create event listener for video-offer-ice-candidate
      socket.on(
        "video-offer-ice-candidate",
        (data: { candidate: RTCIceCandidateInit }) => {
          console.log("LOG: receive { video-offer-ice-candidate } data:", data);
          const candidate = new RTCIceCandidate(data.candidate);
          pc.current.addIceCandidate(candidate);
        }
      );
    }
  }

  // behaviour of the video chat widget:
  // when waiting for user: show self video
  // when connected: show remote video
  // when mouseover: show self video

  const { hovered, ref: containerRef } = useHover();
  const showSelf = hovered || callStatus === CALL_STATUS.CALLING;

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
          onClick={onCallButtonPress}
          loading={callStatus === CALL_STATUS.CALLING}
        >
          {" "}
          {callStatus === CALL_STATUS.IDLE ? (
            <IconVideo size="20px" />
          ) : (
            <IconPhoneEnd size="20px" />
          )}
        </ActionIcon>
      </Group>

      {/* Portal to outside of the Collapse element */}
      {createPortal(
        <Box
          className={classes.videoContainer}
          ref={containerRef}
          display={callStatus === CALL_STATUS.CONNECTED ? "block" : "none"}
        >
          {/* <h1>Video Chat Widget</h1> */}

          <Box
            className={classes.selfVideoContainer}
            key={"self"}
            style={{ display: showSelf ? "block" : "none" }}
          >
            <Text className={classes.selfVideoDescriptor}>
              {" "}
              {user.displayName} (You)
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
              onClick={onCallButtonPress}
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
              onClick={onCallButtonPress}
            >
              {" "}
              End call{" "}
            </Button>
          </Box>
        </Box>,
        document.getElementById("video-chat-widget")
      )}
    </Box>
  );
}
