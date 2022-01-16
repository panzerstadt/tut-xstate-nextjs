import { useMachine } from "@xstate/react";
import React, { useEffect, useRef } from "react";
import { assign, createMachine, EventObject, spawn } from "xstate";
import { EventType } from "../components/subreddit.types";
import { createSubredditMachine, Subreddit } from "../components/subreddit";

const SUBREDDITS = [
  "mechanicalkeyboards",
  "unrealengine",
  "3Dprinting",
  "frontend",
  "reactjs",
  "vuejs",
  "eli5_programming",
  "XState",
  "statemachines",
];

interface Context {
  subreddits: { [key in string]: any };
  subreddit: any | null;
  subredditName: string | null;
}

interface Event extends EventObject {
  name: string;
}

export const redditMachine = createMachine<Context, Event>({
  id: "reddit",
  initial: "idle",
  context: {
    subreddits: {}, // mapping (cache)
    subreddit: null,
    subredditName: null,
  },
  states: {
    idle: {},
    selected: {}, // no invocations needed
  },
  on: {
    // top level transition event (global?)
    [EventType.SELECT]: {
      target: ".selected", // relative gosh
      actions: assign((context, event) => {
        // if exists, use existing actor
        let subreddit = context.subreddits[event.name];

        if (subreddit) {
          return {
            ...context,
            subreddit,
            subredditName: event.name,
          };
        }

        // else spawn a new subreddit
        subreddit = spawn(createSubredditMachine(event.name));

        return {
          subreddits: {
            ...context.subreddits,
            [event.name]: subreddit,
          },
          subreddit,
          subredditName: event.name,
        };
      }),
    },
  },
});

const Reddit = () => {
  const [state, send] = useMachine(redditMachine);
  const { subreddit } = state.context as Context;

  const subredditRef = useRef(state.context.subredditName);
  useEffect(() => {
    subredditRef.current = state.context.subredditName;
  }, [state]);

  const handleTab = (e: KeyboardEvent) => {
    const currentSubreddit = subredditRef.current;
    if (e.code === "Comma") {
      const prevIndex = SUBREDDITS.findIndex((v) => v === currentSubreddit) - 1;
      const prevSubreddit =
        SUBREDDITS[prevIndex] || SUBREDDITS[SUBREDDITS.length - 1];
      console.log("selecting", prevSubreddit);
      return send("SELECT", { name: prevSubreddit });
    }
    if (e.code === "Period") {
      const nextIndex = SUBREDDITS.findIndex((v) => v === currentSubreddit) + 1;
      const nextSubreddit = SUBREDDITS[nextIndex] || SUBREDDITS[0];
      console.log("selecting", nextSubreddit);

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
          {SUBREDDITS.map((subreddit) => {
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
            onClick={() => handleTab({ code: "Comma" } as KeyboardEvent)}
          >
            {"<"}
          </button>
          <button
            className="px-3 font-extrabold"
            onClick={() => handleTab({ code: "Period" } as KeyboardEvent)}
          >
            {">"}
          </button>
        </div>
      </header>

      {!subreddit && (
        <div className="h-full w-full flex flex-col items-center justify-center text-stone-600">
          <p className="mb-4">Select a subreddit</p>
          <ul className="flex flex-col gap-1">
            {SUBREDDITS.map((sr) => {
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

      {subreddit && <Subreddit service={subreddit} key={subreddit} />}
    </main>
  );
};

export default Reddit;
