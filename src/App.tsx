import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useRef, useState } from "react";
import "./index.css";
import { toast, Toaster } from 'sonner';

export function App() {
  const socketRef = useRef<ReconnectingWebSocket | null>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const chatsSectionRef = useRef<HTMLDivElement>(null);
  const [sideBarMobileExpanded, setSideBarMobileExpanded] = useState(false);

  const SendMessage = () => {
    if (msgInputRef.current!.value.trim() !== '') {
      socketRef.current?.send(msgInputRef.current!.value);
      msgInputRef.current!.value = '';
    }
  }

  const [connectedUsers, setConnectedUsers] = useState<{
    name: string
  }[]>([]);

  const [messages, setMessages] = useState<{
    id: string,
    user: string,
    content: string
  }[]>([]);

  const [my, setMy] = useState<{
    name: string
  }>({
    name: ''
  });

  useEffect(() => {
    const ws = new ReconnectingWebSocket('/ws', [], {
      connectionTimeout: 1000,
      maxRetries: 5
    });
    socketRef.current = ws;

    ws.onmessage = (e) => {
      const message = JSON.parse(e.data);
      switch (message.type) {
        case 'message':
          const bottom = chatsSectionRef.current!.scrollHeight - chatsSectionRef.current!.scrollTop - chatsSectionRef.current!.clientHeight < 100;

          setMessages(msg => [...msg, {
            id: message.data.id,
            content: message.data.content,
            user: message.data.user
          }]);

          // If user is at end of chat, scroll to the latest message
          if (bottom) {
            chatsSectionRef.current!.scrollTop = chatsSectionRef.current!.scrollHeight;
          }

          break;
        case 'current-user-context':
          setMy({
            name: message.data.name
          });
          break;
        case 'connected-users-list':
          setConnectedUsers(message.clients);
          break;

        case 'messages-list':
          const messages = message.messages as string[];
          const parsed_messages = messages.map(msg => JSON.parse(msg));
          setMessages(parsed_messages);
          break;

        case 'error':
          toast.error(message.data.error_message, {
            description: message.data.error_desc
          });
          break;

        case 'end-connection':
          ws.close();
          break;

        default:
          console.log('Unhandled message type: ' + message.type);
          break;
      }
    }

    ws.onerror = (e) => {
      toast.error('Websocket errored out: ' + e);
    }

    ws.onclose = () => {
      console.log('Websocket closed');
    }

    ws.onopen = () => {
      console.log('Websocket opened');
    }

    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <Toaster />
      {/* <div className="overlay"></div> */}
      <div className="main-header">
        <img onClick={() => setSideBarMobileExpanded(e => !e)}
          className='hamburger-menu'
          src={require('./assets/hamburger-menu.svg')} />
        <h1>Public Chat</h1>
      </div>

      <div className="container">
        <div className={`sidebar ${sideBarMobileExpanded ? 'open' : 'closed'}`}>
          {connectedUsers.map(e => {
            return (
              <div className="person" key={e.name}>
                <div className="left">
                  <img src={`/pfp/${e.name}`} alt="" className="pfp" />
                </div>
                <div className="right">
                  <div className="name">
                    {e.name}
                  </div>
                  <div className="status">Online</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-area">
          <div className="chats" ref={chatsSectionRef}>
            {
              messages.map(msg => {
                return (
                  <div key={msg.id} className={`chat ${msg.user === my.name ? 'sent' : 'received'}`}>
                    <div className="up">
                      <img src={`/pfp/${msg.user}`} alt="" className="pfp" />
                      <div className="name">{msg.user}</div>
                    </div>

                    <div className="down">
                      <div className="chat">{msg.content}</div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div className="input-section">
            <input onKeyDown={e => e.key === 'Enter' && SendMessage()} ref={msgInputRef} type="text" className="chat-input" placeholder="Enter your message..." />
            <button className="btn-send" onClick={() => SendMessage()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
