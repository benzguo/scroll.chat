<script>
  import { user } from "./user-store.js";
  import { gunStore, msgStore, presenceStore } from "./gun-store";
  import { onMount } from "svelte";
  import { toHSL } from "./hsl.js";

  // external props
  export let theme = "light"; // dark
  export let chat = "open"; // closed

  // internal props
  let blackT = "#000000aa";
  let blackXT = "#00000055";
  let black = "#000000";
  let whiteT = "#ffffffdd";
  let white = "#ffffff";
  let mouseY = 0;
  let scrollY = 0;
  let lastTickScrollY = 0;
  let isScrolling = false;
  let innerHeight = 0;
  let scrollHeight = 1;
  let chatScrollArea = 0.6; // screen height = 1.0
  let newMessage;
  let showingChat = true;
  let toggledChat = false;
  let newMessageInput;
  let newMessageY = null;

  function isDark(theme) {
    return theme === "dark";
  }

  function isShowingChat(chat, showingChat) {
    if (chat === "closed" && !toggledChat) {
      return false;
    }
    return showingChat;
  }

  function handleKeydown(e) {
    // enter
    if (e.keyCode === 13) {
      if (!newMessage) return;
      e.preventDefault();
      handleSubmit();
    }
    // esc
    else if (e.keyCode === 27) {
      if (showingChat) {
        e.preventDefault();
        showingChat = false;
      }
    }
  }

  function handleMousemove(event) {
    mouseY = event.clientY;
  }

  function handleSubmit() {
    if (!newMessage) return;
    gunStore.pushMessage({
      msg: newMessage,
      user: $user,
      yRel: getYRel()
    });
    newMessage = "";
  }

  async function handleSidebarClick() {
    newMessageY = scrollY + mouseY;
    setPresence();
    setTimeout(() => {
      newMessageInput.focus();
    }, 0);
  }

  async function toggleShowingChat() {
    showingChat = !showingChat;
    toggledChat = true;
    if (showingChat) {
      setTimeout(() => {
        newMessageInput.focus();
      }, 0);
    } else {
      gunStore.deletePresence($user);
    }
  }

  function handleNewMessageInputFocus(event) {
    setPresence();
  }

  function getYRel() {
    if (newMessageY) {
      return (newMessageY - 30) / scrollHeight;
    } else {
      return (scrollY + innerHeight - 160) / scrollHeight;
    }
  }

  function setPresence() {
    gunStore.setPresence({ user: $user, yRel: getYRel() });
  }

  function removePresence() {
    gunStore.deletePresence($user);
  }

  onMount(async () => {
    scrollHeight = document.documentElement.scrollHeight;
    // detect scroll stop
    const interval = setInterval(() => {
      let newIsScrolling = lastTickScrollY !== scrollY;
      if (isScrolling !== newIsScrolling) {
        isScrolling = newIsScrolling;
        if (!isScrolling) {
          setPresence();
          newMessageY = null;
        }
      }
      lastTickScrollY = scrollY;
    }, 200);
    // detect switching window or tab
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") {
        removePresence();
      }
    });
    // detect window resize
    // BUG: widening doesn't work
    window.onresize = () => {
      setTimeout(() => {
        scrollHeight = document.documentElement.scrollHeight;
      }, 0);
    };
  });
</script>

<style>
  .scroll-chat-container {
    width: 100vw;
  }

  .chat-sidebar {
    position: absolute;
    background-color: var(--color-bg);
    width: 1rem;
    z-index: 40;
    padding: 0px;
  }

  .chat-messages {
    position: absolute;
    background-color: transparent;
    width: auto;
    padding-left: 1rem;
  }

  .chat-message-container {
    position: absolute;
    width: calc(100vw - 10px);
  }

  .chat-message {
    color: var(--color-fg);
    font-size: 1rem;
    font-family: sans-serif;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    background-color: var(--color-bg);
  }

  .chat-presences {
    position: absolute;
    background-color: transparent;
    width: auto;
    padding-left: 0px;
  }

  .chat-presence {
    position: absolute;
    width: 0.9rem;
    height: 0.9rem;
    z-index: 60;
    border: solid;
    border-width: 1px;
    border-color: var(--color-bg-input);
  }

  .new-message {
    position: fixed;
    bottom: 0px;
    padding-bottom: 4.5rem;
    padding-left: 1rem;
    padding-right: 50px;
  }

  .new-message input {
    background: var(--color-bg-input);
    font-size: 1.125rem;
    font-family: sans-serif;
    padding: 1rem;
    height: 20px;
    width: calc(100vw - 4rem);
    border: solid;
    border-width: 2px;
  }

  .chat-toolbar {
    background-color: var(--color-bg);
    position: fixed;
    margin-left: 10px;
    bottom: 0px;
    z-index: 50;
  }

  .toggle-chat-button {
    background: none;
    border: none;
    padding-left: 5px;
    padding-top: 1rem;
    padding-right: 1rem;
    padding-bottom: 1.5rem;
    color: var(--color-fg);
    font-size: 1rem;
    font-family: sans-serif;
  }
</style>

<svelte:options tag={'scroll-chat'} />

<svelte:window bind:scrollY bind:innerHeight />

<div
  class="scroll-chat-container"
  on:mousemove={handleMousemove}
  style="--color-bg: {isDark(theme) ? blackT : whiteT}; --color-fg: {isDark(theme) ? white : black};
  --color-bg-input: {white}; --color-fg-input: {black};">
  <div
    class="chat-sidebar"
    on:click={handleSidebarClick}
    style="height: {scrollHeight}px;" />
  <div class="chat-messages" hidden={!isShowingChat(chat, showingChat)}>
    {#each $msgStore as val (val.msgId)}
      <div
        class="chat-message-container"
        style="top: {val.yRel * scrollHeight}px;">
        <!-- hidden={(innerHeight - (val.yRel * scrollHeight - scrollY)) / innerHeight >= 0.6} -->
        <span
          class="chat-message"
          style="filter: drop-shadow(4px 4px 4px {toHSL(val.user)});
          will-change: filter;">
          {val.msg}
        </span>
      </div>
    {/each}
  </div>
  <div class="chat-presences">
    {#each $presenceStore as p (p.msgId)}
      <div
        class="chat-presence"
        style="top: {p.yRel * scrollHeight}px; background-color: {toHSL(p.user)};" />
    {/each}
  </div>
  <div
    class="new-message"
    hidden={!isShowingChat(chat, showingChat)}
    style="position: {newMessageY ? 'relative' : 'fixed'}; bottom: -{newMessageY || '0'}px;">
    <form method="get" autocomplete="off" on:submit|preventDefault>
      <div>
        <input
          style="filter: drop-shadow(4px 4px 4px {toHSL($user)})"
          class="input"
          type="text"
          name="null"
          maxLength="160"
          bind:this={newMessageInput}
          bind:value={newMessage}
          on:keydown={handleKeydown}
          on:focus={handleNewMessageInputFocus}
          placeholder="new message" />
      </div>
    </form>
  </div>
  <div
    class="chat-toolbar"
    style="filter: drop-shadow(4px 4px 4px {toHSL($user)})">
    <button class="toggle-chat-button" on:click={toggleShowingChat}>
      {isShowingChat(chat, showingChat) ? '< hide' : '> chat'}
    </button>
  </div>
</div>
