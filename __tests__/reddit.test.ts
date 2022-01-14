
import { interpret } from "xstate";
import { assert } from 'chai';

import { redditMachine } from "../pages/reddit";

describe("reddit machine (live)", () => {
    it('should load posts of a selected subreddit', (done) => {
        const redditService = interpret(redditMachine).onTransition(state => {
            // when state reaches 'selected.loaded', its considered done

            if (state.matches({ selected: 'loaded' })) {
                assert.isNotEmpty(state.context.posts)

                done()
            }
        }).start()


        // send select, and that the machine will end up at loaded
        redditService.send("SELECT", { name: "reactjs" })
    })
})