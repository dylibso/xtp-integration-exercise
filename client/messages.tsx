import { Avatar, Message } from "@chatscope/chat-ui-kit-react";
import React from "react"

export enum MessageType {
  Text = "text",
  Html = "html",
  Image = "image",
}

export interface Message {
  type: MessageType;
  body: string;
  nick: string;
}

const avatars = {
  mine: "https://chatscope.io/storybook/react/assets/zoe-E7ZdmXF0.svg",
  bot: "https://chatscope.io/static/joe-641da105b2f2f31a2174bffaa5dcac11.svg",
}

export function toComponent(message: Message) {
  return (
    <Message
      avatarSpacer={true}
      model={{
        direction: message.nick === "bot" ? "incoming" : "outgoing",
        message: message.body,
        type: message.type,
        sentTime: "just now",
        sender: message.nick,
        position: "normal",
      }}>
      <Avatar src={message.nick === 'bot' ? avatars.bot : avatars.mine} name={message.nick} />
    </Message>
  )
}

export const DEFAULT_MESSAGES: Message[] = [
  {
    body: "Hello I am an employee at Acme Corp",
    type: MessageType.Text,
    nick: "me",
  },
  {
    body: "Hello I am a bot installed into Acme Corp's Yak instance. If you want me to do something, try starting your message with slash `/` and a valid command.",
    type: MessageType.Text,
    nick: "bot",
  },
]
