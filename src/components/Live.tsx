import { useCallback, useEffect, useState } from "react";
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "@liveblocks/react";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import { LiveCursors, CursorChat, FlyingReaction, ReactionSelector } from "./index";
import useInterval from "@/hooks/useInterval";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const Live = ({ canvasRef }: Props) => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;
  const [cursorState, setCursorState] = useState<CursorState>({ mode: CursorMode.Hidden });
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const broadcast = useBroadcastEvent();

  // >>>
  const setReaction = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  useInterval(() => {
    setReactions((reactions) => reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000));
  }, 1000);

  useInterval(() => {
    if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
      setReactions((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      });
    }
  }, 100);

  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;
    setReactions((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({ mode: CursorMode.Chat, previousMessage: null, message: "" });
      } else if (e.key === "Escape") {
        updateMyPresence({ message: "" });
        setCursorState({ mode: CursorMode.Hidden });
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
      updateMyPresence({
        cursor: {
          x,
          y,
        },
      });
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
      updateMyPresence({ cursor: { x, y } });
      // if cursor is in reaction mode, set isPressed to true
      setCursorState((prevState: CursorState) => (cursorState.mode === CursorMode.Reaction ? { ...prevState, isPressed: true } : prevState));
    },
    [setCursorState]
  );

  const handlePointerUp = useCallback(() => {
    setCursorState((prevState: CursorState) => (cursorState.mode === CursorMode.Reaction ? { ...prevState, isPressed: true } : prevState));
  }, [setCursorState]);

  const handlePointerLeave = useCallback(() => {
    setCursorState({ mode: CursorMode.Hidden });
    updateMyPresence({ cursor: null, message: null });
  }, [updateMyPresence]);

  return (
    <div
      id='canvas'
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={{ cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto" }}
      className='relative flex h-[100vh] w-full items-center justify-center text-center'
    >
      <canvas ref={canvasRef} />

      {/* Render the reactions */}
      {reactions.map((reaction) => (
        <FlyingReaction key={reaction.timestamp.toString()} x={reaction.point.x} y={reaction.point.y} timestamp={reaction.timestamp} value={reaction.value} />
      ))}

      {cursor && <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setCursorState} updateMyPresence={updateMyPresence} />}
      {/* If cursor is in reaction selector mode, show the reaction selector */}
      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector
          setReaction={(reaction) => {
            setReaction(reaction);
          }}
        />
      )}
      {/* Show the live cursors of other users */}
      <LiveCursors others={others} />
    </div>
  );
};

export default Live;
