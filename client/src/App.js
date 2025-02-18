import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [sessionId, setSessionId] = useState('');
  const [userId, setUserId] = useState('');
  const [vote, setVote] = useState('');
  const [votes, setVotes] = useState({});

  useEffect(() => {
    socket.on('update-votes', (votes) => {
      setVotes(votes);
    });

    return () => {
      socket.off('update-votes');
    };
  }, []);

  const createSession = async () => {
    const response = await fetch('http://localhost:3001/create-session', {
      method: 'POST',
    });
    const data = await response.json();
    setSessionId(data.sessionId);
  };

  const joinSession = () => {
    socket.emit('join-session', sessionId);
  };

  const submitVote = () => {
    socket.emit('vote', { sessionId, userId, vote });
  };

  return (
    <div>
      <h1>Estimation Poker</h1>

      <button onClick={createSession}>Create Session</button>
      <input
        type="text"
        placeholder="Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
      />
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={joinSession}>Join Session</button>

      <input
        type="text"
        placeholder="Vote"
        value={vote}
        onChange={(e) => setVote(e.target.value)}
      />
      <button onClick={submitVote}>Submit Vote</button>

      <h2>Votes</h2>
      <ul>
        {Object.entries(votes).map(([userId, vote]) => (
          <li key={userId}>{userId}: {vote}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
