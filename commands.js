/**
 * @typedef {Object} Message
 * @property {string} body - The body of the message.
 * @property {string} type - The type of the message: {'text','html','image'}
 * @property {string} nick - The nickname of the sender.
 */

/**
 * This built-in command counts the vowels in the message and responds
 * with a count.
 *
 * @param {Message} Input message from user 
 * @returns {Message} Response message from bot
 */
function countvowels(message) {
  const vowels = ['a', 'e', 'i', 'o', 'u']
  let count = 0;
  for (const c of message.body) {
    if (vowels.includes(c)) count++
  }
  return {
    body: `countvowels: ${count}`,
    type: 'text',
    nick: 'bot',
  }
}

// These are all our built in commands
const BUILTIN_COMMANDS = {
  countvowels
}

/**
 * Returns a list of command names for the auto-complete
 */
export async function getCommands() {
  return Object.keys(BUILTIN_COMMANDS)
}

/**
 * Handles a message
 */
export async function commandHandler(message) {
  // split into command and commandBody
  const re = new RegExp('^/([^\\s]+)\\s*(.*)$');
  const [_full, commandName, commandBody] = message.body.match(re)
  // replace the body with just the arguments to the command for simplicity
  if (commandBody) message.body = commandBody

  let botMessage = {
    body: `Error: unknown command ${commandName}`,
    type: 'text',
    nick: 'bot',
  }

  const command = BUILTIN_COMMANDS[commandName]
  if (command) {
    botMessage = command(message)
  }

  botMessage.nick = 'bot'

  return {
    type: "message",
    payload: botMessage
  }
}
