import { useEffect, useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Editor from "@monaco-editor/react";

const socket = io("https://code-editor-backend-rera.onrender.com");


function App() {
  const [editor, setEditor] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [typing, setTyping] = useState("");

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setEditor(true);
    }
  };

  useEffect(() => {
    const handleUserLeft = (leftUser) => {
      toast(`${leftUser} has left the room`);
    };

    const handleUserJoined = (updatedUsers) => {
      setUsers(updatedUsers);
      if (updatedUsers.length > 0) {
        toast(`${updatedUsers[updatedUsers.length - 1]} has joined the room!`);
      }
    };

    const handleUserAvailable = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    const handleLanguageChange = (lang) => {
      console.log("Received language change:", lang);
      setLanguage(lang);
    };

    const codeChangeHandler = ({ code, userName }) => {
      setCode(code);

      // Show who is typing
      setTyping(`${userName} is typing...`);

      // Clear the typing status after 2 seconds
      setTimeout(() => setTyping(""), 2000);
    };

    // Add event listeners
    socket.on("userLeft", handleUserLeft);
    socket.on("userJoined", handleUserJoined);
    socket.on("userAvailable", handleUserAvailable);
    socket.on("language-change", handleLanguageChange);
    socket.on("codeChange", codeChangeHandler);

    // Cleanup event listeners
    return () => {
      socket.off("userLeft", handleUserLeft);
      socket.off("userJoined", handleUserJoined);
      socket.off("userAvailable", handleUserAvailable);
      socket.off("language-change", handleLanguageChange);
      socket.off("codeChange", codeChangeHandler);
    };
  }, []);

  const handleCodeChange = (newValue) => {
    setCode(newValue);

    // Emit the updated code with the current user
    socket.emit("codeChange", { code: newValue, userName });
  };

  const languageChange = (e) => {
    const lang = e.target.value;
    console.log("Emitting language change:", lang);
    setLanguage(lang); // Optional: Update locally for instant feedback
    socket.emit("language-change", lang);
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(
        () => {
          toast("Room ID copied to clipboard!");
        },
        (err) => {
          console.error("Failed to copy room ID:", err);
          toast.error("Failed to copy Room ID.");
        }
      );
    }
  };

  const leaveRoom = () => {
    // Emit a "leave" event to the server and refresh the page
    socket.emit("leave", { roomId, userName });
    window.location.reload();
  };

  if (!editor) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Join a Room</h2>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <Editor
          theme="vs-dark"
          height="70vh"
          language={language}
          value={code}
          onChange={handleCodeChange}
        />
      </div>
      <div className="chat-room">
        <div className="chat-room-header">
          <h1>Welcome to Room: {roomId}</h1>
          <p>Username: {userName}</p>
        </div>
        <div className="chat-room-content">
          <h2>Users in Room:</h2>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
          {/* Show typing status */}
          <div>
            <h4>{typing}</h4>
          </div>
          <div className="chat-room-actions">
            <select onChange={languageChange} value={language}>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
            <button onClick={copyRoomId}>Copy Room ID</button>
            <button onClick={leaveRoom}>Leave</button>
          </div>
        </div>
        <ToastContainer />
      </div>
    </>
  );
}

export default App;
