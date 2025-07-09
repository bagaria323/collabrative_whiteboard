
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  const createNewBoard = () => {
    // Generate a simple, random 7-character ID for the board
    const boardId = Math.random().toString(36).substring(2, 9);
    navigate(`/board/${boardId}`);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Boardify</h1>
        <p>A real-time, collaborative whiteboard for your team.</p>
        <button onClick={createNewBoard} className="create-board-button">
          Create a New Board
        </button>
      </div>
    </div>
  );
};

export default Home;