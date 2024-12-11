import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faImage } from "@fortawesome/free-solid-svg-icons";
import { FixedSizeList as List } from "react-window";

interface Message {
  sender: string;
  content: string;
  timestamp: number;
}

const socketUrl = "ws://localhost:3000"; // Replace with your WebSocket server URL

const IndivitualChat = () => {
  const { chatId } = useParams<{ chatId: string }>(); // Capture dynamic chatId from URL
  console.log(chatId)
  const self = "dev"; // The current user (change as necessary)

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null); // To store the WebSocket connection

  const listRef = useRef<List | null>(null); // Ref for the List component

  // Determine if it's a group or private chat
  const isGroupChat = chatId && chatId.startsWith("group:"); // Check if the chatId starts with 'group:'
  const chatIdentifier = isGroupChat ? chatId.substring(6) : chatId; // Remove "group:" prefix if it's a group chat

  // Clear previous messages when changing chats
  useEffect(() => {
    setMessages([]); // Clear previous messages when changing chats

    // Dynamically set the WebSocket connection URL
    const socketConnection = new WebSocket(`${socketUrl}/${chatIdentifier}/${self}`);

    setSocket(socketConnection);

    socketConnection.onopen = () => {
      console.log(`WebSocket connection established with ${chatIdentifier}`);
      socketConnection.send(
        JSON.stringify({
          sender: self,
          recipient: chatIdentifier,
          text: `joined the chat`,
        })
      );
    };

    socketConnection.onmessage = (event) => {
      try {
        let data = JSON.parse(event.data);
        data = Array.isArray(data) ? data : [data];
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].messages)) {
          const dataMessages = data[0].messages;
          const incomingMessages: Message[] = dataMessages.map((message: any) => ({
            sender: message.sender,
            content: message.content,
            timestamp: message.timestamp,
          }));
          setMessages((prevMessages) => [...prevMessages, ...incomingMessages]);
        }
      } catch (error) {
        console.error("Error processing incoming message:", error);
      }
    };

    socketConnection.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };

    return () => {
      if (socketConnection) {
        socketConnection.close();
        console.log("WebSocket disconnected");
      }
    };
  }, [chatIdentifier]); // Dependencies: when chatIdentifier changes (either username or groupname)

  // Function to render individual message items for the List
  const renderMessage = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const isSender = message.sender === self;

    // Format timestamp to human-readable format
    const formattedTime = new Date(message.timestamp).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <div key={index} style={style} className={`flex items-start mb-4`}>
        <div className={`${isSender ? "ml-auto" : ""}`}>
          <div className={`flex flex-col max-w-xs ${isSender ? "items-end" : "items-start"}`}>
            {/* Display sender name for group chats */}
            {isGroupChat && !isSender && (
              <div className="chat-header text-sm font-semibold text-white text-left">
                {message.sender}
              </div>
            )}
            <div
              className={`rounded-lg p-2 ${
                isSender ? "bg-blue-500 text-white" : "bg-gray-600 text-white"
              }`}
            >
              {message.content}
            </div>
            <div className="text-xs text-gray-400 mt-1">{formattedTime}</div> {/* Timestamp */}
          </div>
        </div>
      </div>
    );
  };

  // Scroll to bottom logic when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1); // Scroll to the last message
    }
  }, [messages]); // Trigger scroll when messages change

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (message.trim() && socket) {
      const messageData = {
        type: isGroupChat ? "group" : "private", // Dynamic type based on chat type
        sender: self,
        receiver: chatIdentifier,
        content: message,
      };
      socket.send(JSON.stringify(messageData)); // Send message via WebSocket
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: self, content: message, timestamp: Date.now() },
      ]);
      setMessage(""); // Clear input field
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const userData = {
    profilePicture: "https://via.placeholder.com/53",
    name: isGroupChat ? `Group: ${chatIdentifier}` : chatIdentifier, // For group chat, show group name
  };

  return (
    <div className="flex-col w-full h-full">
      <div className="flex items-center bg-black px-4 py-3 lg:h-[64px] sm-custom:h-[49px]">
        <img
          src={userData.profilePicture || "https://via.placeholder.com/50"}
          alt="User Profile"
          className="lg:w-10 lg:h-10 sm-custom:w-8 sm-custom:h-8 rounded-full"
        />
        <div className="ml-3">
          <h1 className="sm-custom:text-sm sm:text-sm lg:text-lg font-semibold text-white">
            {userData.name || "Username"}
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:h-[calc(100vh-128px)] sm-custom:h-[calc(100vh-110px)] w-full bg-blackv1">
        <div className="flex-1 bg-blackv1 p-6 sm-custom:p-[10px] sm:p-[18px] flex flex-col justify-start items-start">
          <List
            ref={listRef} // Attach the ref to the List component
            height={window.innerHeight - 250} // Adjust the height according to your layout
            itemCount={messages.length}
            itemSize={105} // Adjust item height as per your design
            width="100%"
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-blackv1 scrollbar-track-transparent"
          >
            {renderMessage}
          </List>
        </div>

        <div className="flex items-center p-4 bg-black border-gray-600">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full p-3 pl-4 pr-16 rounded-full bg-gray-800 text-white sm-custom:text-[12px] sm:text-[16px] focus:outline-none border border-blackv1"
            />
            <button className="absolute top-1/2 sm:right-[80px] sm-custom:right-[60px] transform -translate-y-1/2 text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faImage} size="lg" />
            </button>

            <button
              onClick={handleSend}
              className="absolute top-1/2 sm:right-[40px] sm-custom:right-[20px] transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FontAwesomeIcon icon={faPaperPlane} size="lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndivitualChat;