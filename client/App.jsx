import React, { useState, useEffect, useRef } from "react"
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css"
import {
  MainContainer,
  ChatContainer,
  MessageList,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import { DEFAULT_MESSAGES, toComponent as messageToComponent } from "./messages";

export default function App() {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES)
  const [listening, setListening] = useState(false)
  const [inputMessage, setInputMessage] = useState("")
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0 })
  const [commands, setCommands] = useState([])
  const [allCommands, setAllCommands] = useState([])
  const inputRef = useRef(null)

  const setInputValue = (value) => {
    setInputMessage(value)

    // should break when whitespace is added
    const choosingCommand = /\/\S*$/.test(value)
    console.log("Choosing command?", choosingCommand)

    if (choosingCommand) {
      const filteredSuggestions = allCommands.filter(command =>
        command.startsWith(value.substring(1))
      )
      const chatInput = document.getElementById("chat-input")
      const rect = chatInput.getBoundingClientRect()
      setInputPosition({ top: rect.top, left: rect.left })
      setCommands(filteredSuggestions)
    } else {
      setCommands([])
    }
  }

  const subscribe = async () => {
    console.log('Attempt to subscribe')
    if (!listening) {
      const events = new EventSource("/events");
      console.log('Subscribing to /events')
      events.onmessage = event => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'heartbeat':
            console.log("heartbeat : ", message.payload.heartbeat)
            break
          case 'message':
            setMessages(m => [...m, message.payload])
            break
          default:
            console.error('unknown message ', message)
            break
        }
      }
      events.onerror = e => {
        console.error(e)
      }
      setListening(true)
    }
  }

  const fetchCommands = () => {
    fetch("/slash-commands", {
      method: "GET",
      headers: {
        'Content-Type': "application/json"
      }
    }).then((r) => {
      r.json().then((c) => {
        console.log("Setting slash commands: ", c.slash_commands)
        setAllCommands(c.slash_commands)
      })
      setTimeout(fetchCommands, 5000)
    })
  }

  useEffect(() => {
    fetchCommands()
    subscribe()
  }, [])

  const handleSend = () => {
    fetch("/messages", {
      method: "POST",
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({
        nick: "me",
        body: inputMessage
      })
    }).then(console.log)

    setInputValue("")
  }

  const handleInputKeyUp = (event) => {
    if (commands.length === 0) return
    switch (event.key) {
      case 'Tab':
        // choose the first one
        setInputMessage(`/${commands[0]} `)
        setCommands([])
        inputRef.current.focus()
        break
    }

  }

  const handleSuggestionClick = (suggestion) => {
    console.log("Handle suggestion click ", suggestion)
    setInputMessage(`/${suggestion}`)
    setCommands([])
    inputRef.current.focus()
  }

  const chatMessages = messages.map(messageToComponent)

  return <>
    <h2 style={{ position: 'absolute', paddingLeft: '20px', zIndex: 2 }}>Acme Inc. Chat</h2>
    <div style={{ margin: "auto", maxWidth: "1000px", height: "100%" }}>
      <MainContainer style={{ height: "100%" }}>
        <ChatContainer>
          <MessageList>
            {chatMessages}
          </MessageList>
          <MessageInput
            ref={inputRef}
            id="chat-input"
            placeholder="Type message here"
            onSend={handleSend}
            onChange={setInputValue}
            value={inputMessage}
            onKeyUp={handleInputKeyUp}
          />
        </ChatContainer>
      </MainContainer>
      {commands.length > 0 && (
        <div style={{
          position: 'absolute',
          top: inputPosition.top - (31.2 * commands.length) - 10,
          left: inputPosition.left,
          width: '200px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '5px',
          zIndex: 1,
        }}>
          {commands.map((command, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(command)}
              style={{ padding: '5px', cursor: 'pointer', border: '1px solid #ccc' }}
            >
              {command}
            </div>
          ))}
        </div>
      )}
    </div>
  </>
}
