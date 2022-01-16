import { EventObject } from "xstate";



export enum EventType {
    SELECT = "SELECT",
}

export interface Context {
    subreddit: string | null | undefined;
    posts: any; // TODO:
    lastUpdated: number | null
}

export interface Event extends EventObject {
    name?: string;
}