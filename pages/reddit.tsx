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

  useEffect(() => {
    send("SELECT", { name: "MechanicalKeyboards" });
  }, []);

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <header>
        <select
          className="border px-2 py-1 rounded-md"
          onChange={(e) => {
            e.target.value && send("SELECT", { name: e.target.value });
          }}
        >
          <option value="">--Select a subreddit--</option>
          {subreddits.map((subreddit) => {
            return <option key={subreddit}>{subreddit}</option>;
          })}
        </select>
      </header>

      <section className="overflow-auto px-6 w-full">
        <h1 className="font-bold text-xl uppercase text-orange-500 mb-3">
          {state.matches("idle") ? "Select a subreddit" : subreddit}
        </h1>
        {state.matches({ selected: "loading" }) && (
          <div
            style={{ height: "80vh" }}
            className="w-full flex flex-col items-center justify-center gap-6"
          >
            <div className="h-6 w-6 rounded-md bg-gray-900 animate-spin"></div>
            <h1 className="animate-pulse">Loading...</h1>
          </div>
        )}
        {state.matches({ selected: "loaded" }) && (
          <ul className="grid lg:grid-cols-5 grid-cols-3 gap-3">
            {posts.map((post: any) => {
              console.log("post", post);
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
                        <Image
                          src={previewImage.url}
                          height={previewImage.height}
                          width={previewImage.width}
                          alt={post.title}
                        />
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
