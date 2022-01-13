import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";

const dogMachine = createMachine({
  id: "dog",
  initial: "awake",
  states: {
    awake: {
      on: {
        SLEEP: { target: "asleep" },
        WALK: { target: "walking" },
      },
    },
    asleep: {
      on: {
        WAKE_UP: { target: "awake" },
      },
    },
    walking: {
      on: {
        STOP: { target: "awake" },
      },
    },
  },
});

const Dog = () => {
  const [state, send] = useMachine(dogMachine);

  return (
    <div className="h-screen flex items-center justify-center flex-col">
      <div className="h-60">
        {state.matches("awake") && <img src="/images/awakedog.jpg" />}
        {state.matches("asleep") && <img src="/images/sleepdog.jpg" />}
        {state.matches("walking") && <img src="/images/walkdog.jpg" />}
      </div>

      <div className="mt-2">
        <button onClick={() => send("WAKE_UP")}>Wake Up!</button>
        <button onClick={() => send("SLEEP")}>Go to Sleep!</button>
        <button onClick={() => send("WALK")}>Lets take a walk</button>
        <button onClick={() => send("STOP")}>Stop walking</button>
      </div>
    </div>
  );
};

export default Dog;
