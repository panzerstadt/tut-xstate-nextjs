import { useMachine } from "@xstate/react";
import React, { useEffect, useRef } from "react";
import { assign, createMachine, EventObject } from "xstate";
import { EventType } from "../components/subreddit.types";
import { Subreddit } from "../components/subreddit";

interface Context {
  subreddit: string | null;
}

interface Event extends EventObject {
  name: string;
}

export const redditMachine = createMachine<Context, Event>({
  id: "reddit",
  initial: "idle",
  context: {
    subreddit: null,
  },
  states: {
    idle: {},
    selected: {}, // no invocations needed
  },
  on: {
    // top level transition event (global?)
    [EventType.SELECT]: {
      target: ".selected", // relative gosh
      actions: assign({
        subreddit: (context, event: Event) => event.name,
      }),
    },
  },
});

const Reddit = () => {
  const subreddits = [
    "mechanicalkeyboards",
    "frontend",
    "reactjs",
    "vuejs",
    "eli5_programming",
    "XState",
  ];
  const [state, send] = useMachine(redditMachine);
  const { subreddit } = state.context as Context;

  const subredditRef = useRef(state.context.subreddit);
  useEffect(() => {
    subredditRef.current = state.context.subreddit;
  }, [state]);

  const handleTab = (e: KeyboardEvent) => {
    const currentSubreddit = subredditRef.current;
    if (e.code === "Comma") {
      const prevIndex = subreddits.findIndex((v) => v === currentSubreddit) - 1;
      const prevSubreddit =
        subreddits[prevIndex] || subreddits[subreddits.length - 1];
      return send("SELECT", { name: prevSubreddit });
    }
    if (e.code === "Period") {
      const nextIndex = subreddits.findIndex((v) => v === currentSubreddit) + 1;
      const nextSubreddit = subreddits[nextIndex] || subreddits[0];
      return send("SELECT", { name: nextSubreddit });
    }
  };
  useEffect(() => {
    window.addEventListener("keypress", handleTab);
    return () => {
      window.removeEventListener("keypress", handleTab);
    };
  }, []);

  return (
    <main className="flex flex-col items-start justify-start h-screen">
      <header className="py-3 px-5 w-full flex justify-between">
        <select
          className="border px-2 py-1 rounded-md"
          onChange={(e) => {
            e.target.value && send("SELECT", { name: e.target.value });
          }}
        >
          <option value="">--Select a subreddit--</option>
          {subreddits.map((subreddit) => {
            return (
              <option
                key={subreddit}
                selected={state.context.subreddit === subreddit}
              >
                {subreddit}
              </option>
            );
          })}
        </select>

        <div className="flex gap-1">
          <button
            className="px-3 font-extrabold"
            onClick={() => handleTab({ code: "Comma" } as KeyboardEvent, state)}
          >
            {"<"}
          </button>
          <button
            className="px-3 font-extrabold"
            onClick={() =>
              handleTab({ code: "Period" } as KeyboardEvent, state)
            }
          >
            {">"}
          </button>
        </div>
      </header>

      {!subreddit && (
        <div className="h-full w-full flex flex-col items-center justify-center text-stone-600">
          <p className="mb-4">Select a subreddit</p>
          <ul className="flex flex-col gap-1">
            {subreddits.map((sr) => {
              return (
                <button
                  className="px-3"
                  key={sr}
                  onClick={() => send("SELECT", { name: sr })}
                >
                  {sr}
                </button>
              );
            })}
          </ul>
        </div>
      )}

      {subreddit && <Subreddit name={subreddit} key={subreddit} />}
    </main>
  );
};

export default Reddit;
