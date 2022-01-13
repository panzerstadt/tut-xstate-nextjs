import { useMachine } from "@xstate/react";
import { useEffect } from "react";
import { createMachine, assign } from "xstate";
import cloneDeep from "lodash.clonedeep";
/**
 * 
 * ref: https://dev.to/robertbroersma/undo-redo-in-react-using-xstate-23j8

    Handling Undo
    Remove the last element from the past.
    Set the present to the element we removed in the previous step.
    Insert the old present state at the beginning of the future.

    Handling Redo
    Remove the first element from the future.
    Set the present to the element we removed in the previous step.
    Insert the old present state at the end of the past.

    Handling Other Actions
    Insert the present at the end of the past.
    Set the present to the new state after handling the action.
    Clear the future.
 */

interface Context {
  present: string[]; // the state
  _pasts: string[][]; // an array of lolz. note that these are 'chronological'
  _futures: string[][]; // an array of lolz. note that these are 'chronological'
}

const undoredoMachine = createMachine(
  {
    initial: "normal",
    context: {
      present: [],
      _pasts: [],
      _futures: [],
    },
    states: {
      normal: {
        on: {
          TOGGLE_MODE: {
            target: "turbo",
            actions: (context, event) => alert("going turbo"),
          },
          ADD_DOG: { actions: ["updatePast", "addDog"] },
          DELETE_DOG: { actions: ["updatePast", "deleteDog"] },
          UNDO: { actions: "undo" },
          REDO: { actions: "redo" },
        },
      },
      turbo: {
        on: {
          TOGGLE_MODE: {
            target: "normal",
            actions: (context, event) => alert("slowing down"),
          },
          ADD_DOG: { actions: ["updatePast", "addDog"] },
          DELETE_DOG: { actions: ["updatePast", "deleteDog"] },
          UNDO: { actions: "undo" },
          REDO: { actions: "redo" },
        },
      },
    },
  },
  {
    actions: {
      addDog: assign((context: Context, event, service) => {
        if (service.state?.value === "normal") {
          return { present: [...context.present, "lol"] };
        }
        return {
          present: [...context.present, "lol", "lol", "lol"],
        };
      }),
      deleteDog: assign((context: Context, event) => {
        const copiedPresent = cloneDeep(context.present);
        copiedPresent.pop(); // crap it mutates
        return {
          present: copiedPresent,
        };
      }),
      updatePast: assign((context: Context, event) => {
        return {
          _futures: [],
          _pasts: [...context._pasts, context.present],
        };
      }),
      undo: assign((context: Context, event) => {
        if (context._pasts.length === 0) return context;

        const newPasts = cloneDeep(context._pasts);
        const newFutures = cloneDeep(context._futures);

        const lastPointInTime = newPasts.pop(); // pasts is mutated + returns the last one
        newFutures.unshift(context.present); // futures is mutated

        return {
          present: lastPointInTime, // user sees this
          _pasts: newPasts,
          _futures: newFutures,
        };
      }),
      redo: assign((context: Context, event) => {
        if (context._futures.length === 0) return context;

        const newPasts = cloneDeep(context._pasts);
        const newFutures = cloneDeep(context._futures);

        const lastUndo = newFutures.shift();
        newPasts.push(context.present);

        return {
          present: lastUndo,
          _pasts: newPasts,
          _futures: newFutures,
        };
      }),
    },
  }
);

const UndoRedo = () => {
  const [state, send] = useMachine(undoredoMachine);
  const handleKeypress = (evt: KeyboardEvent) => {
    if (evt.ctrlKey === true) {
      switch (evt.code) {
        case "KeyZ":
          return send("UNDO");
        case "KeyY":
          return send("REDO");
      }
    }
  };
  useEffect(() => {
    window.addEventListener("keypress", handleKeypress);
  }, []);

  return (
    <div className="p-4">
      <button className="mb-4" onClick={() => send("TOGGLE_MODE")}>
        Toggle Mode
      </button>
      <button className="mb-4" onClick={() => send("ADD_DOG")}>
        Make Dog
      </button>
      <button className="mb-4" onClick={() => send("DELETE_DOG")}>
        Ummake Dog
      </button>

      <div className="p-6">
        <div
          className={`h-6 w-6 bg-black rounded-md ${
            state.value === "turbo" ? "animate-spin" : "animate-spin-slow"
          }`}
        ></div>
      </div>

      <div className="flex">
        {state.context.present.map((key, i) => {
          if (key !== "lol") return <div>no dogs for you</div>;
          return <img key={i} className="h-20" src="/images/sleepdog.jpg" />;
        })}
      </div>
      <p>{state.context.present.length} dog(s)</p>

      <br />
      <br />
      <div
        className={`${
          state.context._pasts.length < 10 ? "hidden" : ""
        } text-xs`}
      >
        psst! you can undo/redo with ctrl+z and ctrl+y!
      </div>

      <br />
      <br />
      <br />
      <br />
      <br />
      {JSON.stringify(state.toJSON())}
    </div>
  );
};

export default UndoRedo;
