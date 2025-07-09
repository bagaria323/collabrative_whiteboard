import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import "./Whiteboard.css";

const Whiteboard = forwardRef(
  ({ socket, boardId, color, width, mode, eraserColor }, ref) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      clearCanvas(id) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit("clear", id); // Use the boardId passed from parent
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      contextRef.current = context;

      const resizeCanvas = () => {
        const container = canvas.parentElement;
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        context.putImageData(imageData, 0, 0);
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // --- HISTORY AND REAL-TIME LISTENERS ---
      const drawFromData = (data) => {
        const { x0, y0, x1, y1, color, width, mode } = data;
        const remoteContext = contextRef.current;
        remoteContext.beginPath();
        remoteContext.moveTo(x0, y0);
        remoteContext.lineTo(x1, y1);
        remoteContext.lineWidth = width;
        remoteContext.lineCap = "round";
        remoteContext.strokeStyle =
          mode === "erase" ? eraserColor || "#FFFFFF" : color;
        remoteContext.stroke();
        remoteContext.closePath();
      };

      // Listen for the entire history of the board
      socket.once("load-history", (history) => {
        history.forEach((data) => drawFromData(data));
      });

      socket.on("clear", () => {
        if (contextRef.current) {
          contextRef.current.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      });

      socket.on("drawing", (data) => drawFromData(data));

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        socket.off("clear");
        socket.off("drawing");
        socket.off("load-history");
      };
    }, [eraserColor]);

    const startDrawing = ({ nativeEvent }) => {
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
      lastPosition.current = { x: offsetX, y: offsetY };
    };

    const stopDrawing = () => {
      if (isDrawing) {
        contextRef.current.closePath();
        setIsDrawing(false);
      }
    };

    const draw = ({ nativeEvent }) => {
      if (!isDrawing) return;
      const { offsetX, offsetY } = nativeEvent;
      const context = contextRef.current;

      context.lineWidth = width;
      context.lineCap = "round";
      context.strokeStyle = mode === "erase" ? eraserColor : color;
      context.lineTo(offsetX, offsetY);
      context.stroke();

      socket.emit("drawing", {
        boardId, // IMPORTANT: Include the boardId in every event!
        x0: lastPosition.current.x,
        y0: lastPosition.current.y,
        x1: offsetX,
        y1: offsetY,
        color,
        width,
        mode,
      });

      lastPosition.current = { x: offsetX, y: offsetY };
    };

    return (
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseOut={stopDrawing}
        ref={canvasRef}
      />
    );
  }
);

export default Whiteboard;
