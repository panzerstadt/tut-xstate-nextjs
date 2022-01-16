import { useMachine } from "@xstate/react";
import React, { useEffect } from "react";
import { assign, createMachine, EventObject } from "xstate";
import Image from "next/image";

enum EventType {
  SELECT = "SELECT",
}

const invokeFetchSubreddit = (context: Context) => {
  const { subreddit } = context;

  return fetch(`https://www.reddit.com/r/${subreddit}.json`)
    .then((response) => response.json())
    .then((json) =>
      json.data.children.map((child: { data: unknown }) => child.data)
    );
};

interface Context {
  subreddit: string | null | undefined;
  posts: any; // TODO:
}

interface Event extends EventObject {
  name?: string;
}

export const redditMachine = createMachine<Context, Event>({
  id: "reddit",
  initial: "idle",
  context: {
    subreddit: null,
    posts: null,
  },
  states: {
    idle: {},
    selected: {
      // when selected, start loading data
      initial: "loading",
      states: {
        loading: {
          invoke: {
            id: "fetch-subreddit",
            src: invokeFetchSubreddit,
            onDone: {
              target: "loaded",
              actions: assign({
                posts: (context, event) => event.data,
              }),
            },
            onError: "failed",
          },
        },
        loaded: {},
        failed: {},
      },
    },
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

// sample SELECT event
const selectEvent: Event = {
  type: EventType.SELECT, // event type
  name: "reactjs", // subreddit name
};

const Reddit = () => {
  const subreddits = ["mechanicalkeyboards", "frontend", "reactjs", "vuejs"];
  const [state, send] = useMachine(redditMachine);
  const { subreddit, posts } = state.context as Context;

  const handleTab = (e: KeyboardEvent, machineState: typeof state) => {
    const currentSubreddit = machineState.context.subreddit;
    if (e.code === "Comma") {
      const prevIndex = subreddits.findIndex((v) => v === currentSubreddit) - 1;
      console.log("prev index", prevIndex);
      const prevSubreddit =
        subreddits[prevIndex] || subreddits[subreddits.length - 1];
      send("SELECT", { name: prevSubreddit });
    }
    if (e.code === "Period") {
      const nextIndex = subreddits.findIndex((v) => v === currentSubreddit) + 1;
      const nextSubreddit = subreddits[nextIndex] || subreddits[0];
      send("SELECT", { name: nextSubreddit });
    }
  };
  useEffect(() => {
    window.addEventListener("keypress", (e) => handleTab(e, state));
    return () => {
      window.removeEventListener("keypress", (e) => handleTab(e, state));
    };
  }, [state]);

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

        <div>
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

      <section className="overflow-auto px-6 w-full h-full">
        <h1 className="font-bold text-xl uppercase text-orange-500 mb-3">
          {state.matches("idle") ? "Select a subreddit" : subreddit}
        </h1>
        {state.matches({ selected: "loading" }) && (
          <div
            style={{ height: "80vh" }}
            className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden"
          >
            <div className="h-6 w-6 rounded-md bg-gray-900 animate-spin"></div>
            <h1 className="animate-pulse">Loading...</h1>
          </div>
        )}
        {state.matches({ selected: "loaded" }) && (
          <ul className="grid lg:grid-cols-5 sm:grid-cols-3 grid-cols-1 gap-3">
            {posts.map((post: any) => {
              const previewImage = {
                url: post.thumbnail,
                height: post.thumbnail_height,
                width: post.thumbnail_width,
              };

              return (
                <li key={post.title}>
                  <a
                    href={"https://www.reddit.com" + post.permalink}
                    target="__blank"
                  >
                    <div className="h-full border rounded-md p-3 bg-gray-50 hover:bg-orange-100">
                      <h2 title={post.title} className="font-bold truncate">
                        {post.title}
                      </h2>

                      <p className="line-clamp-3 text-xs">{post.selftext}</p>
                      {post.thumbnail.includes("http") && (
                        <div className="w-full flex items-center justify-center pt-2">
                          <Image
                            src={previewImage.url}
                            height={previewImage.height}
                            width={previewImage.width}
                            alt={post.title}
                          />
                        </div>
                      )}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Reddit;
