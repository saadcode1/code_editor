import { useEffect, useState } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';

const socket = io('http://localhost:3000');

function App() {
  const [editor, setEditor] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState([]);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit('join', { roomId, userName });
      setEditor(true);
    }
  };

  useEffect(() => {
    const handleUserLeft = (leftUser) => {
      toast(`${leftUser} has left the room`);
    };

    const handleUserJoind = (updatedUsers) => {
      setUsers(updatedUsers);
      if (updatedUsers.length > 0) {
        toast(`${updatedUsers[updatedUsers.length - 1]} has joined the room!`);
      }
    };

    const handleUserAvailable = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    // Add event listeners
    socket.on('userLeft', handleUserLeft);
    socket.on('userJoind', handleUserJoind);
    socket.on('userAvailable', handleUserAvailable);

    // Cleanup event listeners
    return () => {
      socket.off('userLeft', handleUserLeft);
      socket.off('userJoind', handleUserJoind);
      socket.off('userAvailable', handleUserAvailable);
    };
  }, []);

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
    <div>
      <h1>Welcome to Room: {roomId}</h1>
      <p>Username: {userName}</p>
      <h2>Users in Room:</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
      <ToastContainer />
    </div>
  );
}

export default App;
