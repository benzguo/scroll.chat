import { writable, derived } from "svelte/store";
import Gun from "gun/gun";

function createStore() {
  // TODO: make this async, select from a remote list of peers
  // use free heroku peers?
  const gun = new Gun([
    "http://localhost:8765/gun",
    // "https://phrassed.com/gun",
    // "https://gunjs.herokuapp.com/gun", // Don't use, unstable
  ]);

  const { subscribe, update } = writable([]);
  const chats = gun.get("test004"); // "chats" was bombed to death

  chats.map().on((val, msgId) => {
    update((state) => {
      const presenceIdx = state.findIndex((m) => m.time === 0 && m.user === val.user);
      if (val.time === 0 && presenceIdx > -1) {
        state[presenceIdx] = {
          msgId,
          msg: val.msg,
          time: 0,
          user: val.user,
          yRel: val.yRel,
        };
        return state;
      }

      if (val)
        state.push({
          msgId,
          msg: val.msg,
          time: parseFloat(val.time),
          user: val.user,
          yRel: val.yRel,
        });

      // no more than 100 messages for now 😥
      if (state.length > 100) state.shift();

      return state;
    });
  });

  return {
    subscribe,
    delete: (msgId) => {
      chats.get(msgId).put(null);
    },
    set: ({ msg, user, time, yRel }) => {
      const msgId = `${time}_${Math.random()}`;
      chats.get(msgId).put({
        msg,
        user,
        time,
        yRel,
      });
    },
  };
}

export const gunStore = createStore();
export const msgStore = derived(gunStore, ($store) =>
  $store.filter((v) => parseFloat(v.time) !== 0)
);
export const presenceStore = derived(gunStore, ($store) =>
  $store.filter((v) => parseFloat(v.time) === 0)
);
