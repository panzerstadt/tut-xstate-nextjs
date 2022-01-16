import { useActor, useMachine, useService } from "@xstate/react";
import { useMemo } from "react";
import { ActorRef, ActorRefFrom, assign, createMachine } from "xstate";
import { Context, Event } from "./subreddit.types";
import Image from "next/image";

const invokeFetchSubreddit = (context: Context): Promise<any> => {
  const { subreddit } = context;

  return fetch(`https://www.reddit.com/r/${subreddit}.json`)
    .then((response) => response.json())
    .then((json) =>
      json.data.children.map((child: { data: Context["posts"] }) => child.data)
    );
};

export const createSubredditMachine = (subreddit: string) => {
  return createMachine<Context, Event>({
    id: "subreddit",
    initial: "loading",
    context: {
      subreddit,
      posts: null,
      lastUpdated: null,
    },
    states: {
      loading: {
        // @ts-ignore
        invoke: {
          id: "fetch-subreddit",
          src: invokeFetchSubreddit,
          onDone: {
            target: "loaded",
            actions: assign({
              posts: (_, event) => event.data,
              lastUpdated: () => Date.now(),
            }),
          },
          onError: "failure",
        },
      },
      loaded: {
        on: {
          REFRESH: "loading",
        },
      },
      failure: {
        on: {
          RETRY: "loading",
        },
      },
    },
  });
};

interface Props {
  service: ActorRef<any>; // the subreddit machine itself
}
export const Subreddit: React.FC<Props> = ({ service }) => {
  const [current, send] = useActor(service);

  if (current.matches("failure")) {
    return (
      <div>
        Failed to load posts.{" "}
        <button onClick={(_) => send("RETRY")}>Retry?</button>
      </div>
    );
  }

  const { subreddit, posts, lastUpdated } = current.context;

  return (
    <section className="overflow-auto px-6 w-full h-full">
      {current.matches("loading") && (
        <div
          style={{ height: "80vh" }}
          className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden"
        >
          <div className="h-6 w-6 rounded-md bg-gray-900 animate-spin"></div>
          <h1 className="animate-pulse">Loading...</h1>
        </div>
      )}
      {current.matches("loaded") && (
        <>
          <h1 className="flex flex-col justify-between font-bold text-xl uppercase text-orange-500 mb-3">
            <p>{subreddit}</p>

            <div className="flex items-end justify-between text-stone-700">
              <small className="text-xs">
                Last updated: {new Date(lastUpdated!).toTimeString()}
              </small>
              <button className="text-base" onClick={(_) => send("REFRESH")}>
                Refresh
              </button>
            </div>
          </h1>

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
        </>
      )}
    </section>
  );
};
