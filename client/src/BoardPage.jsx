import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Whiteboard from "./Whiteboard";
import Toolbar from "./Toolbar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaShareAlt } from "react-icons/fa";
import "./App.css";

const serverUrl = import.meta.env.VITE_SERVER_URL;
const socket = io(serverUrl);

function BoardPage() {
  const { boardId } = useParams();
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(5);
  const [mode, setMode] = useState("draw");
  const whiteboardRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", boardId);
  }, [boardId]);

  const handleClearCanvas = () => {
    if (whiteboardRef.current) {
      whiteboardRef.current.clearCanvas(boardId);
    }
  };

  const handleShare = () => {
    const boardUrl = window.location.href;
    navigator.clipboard
      .writeText(boardUrl)
      .then(() => {
        toast.success("Board link copied to clipboard!", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      })
      .catch((err) => {
        toast.error("Could not copy link.", {
          position: "top-center",
          autoClose: 2000,
        });
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="app-wrapper">
      <ToastContainer />
      <header className="app-header">
        <div className="header-logo">Boardify</div>
        <span className="header-title">Online Whiteboard</span>
        <div className="header-actions">
          <button onClick={handleShare} className="share-button">
            <FaShareAlt />
            <span>Share</span>
          </button>
        </div>
      </header>

      <main className="main-container">
        <Toolbar
          setColor={setColor}
          setWidth={setWidth}
          clearCanvas={handleClearCanvas}
          setMode={setMode}
          currentMode={mode}
          currentColor={color}
        />
        <div className="whiteboard-area">
          <Whiteboard
            ref={whiteboardRef}
            socket={socket}
            boardId={boardId}
            color={color}
            width={width}
            mode={mode}
            eraserColor="#FFFFFF"
          />
        </div>
      </main>
    </div>
  );
}

export default BoardPage;
