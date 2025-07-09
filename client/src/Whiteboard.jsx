import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import "./Whiteboard.css";


let socket;
if (typeof window !== "undefined") {
  const io = require("socket.io-client");
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  socket = io(serverUrl);
}

const Whiteboard = forwardRef(
  ({ boardId, color, width, mode, eraserColor }, ref) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      clearCanvas(id) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (socket) socket.emit("clear", id);
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

      if (socket) {
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
      }

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        if (socket) {
          socket.off("clear");
          socket.off("drawing");
          socket.off("load-history");
        }
      };
    }, [eraserColor]);

    const getCoordinates = (event) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (event.touches && event.touches.length > 0) {
        return {
          offsetX: event.touches[0].clientX - rect.left,
          offsetY: event.touches[0].clientY - rect.top,
          nativeEvent: event,
        };
      }
      return {
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY,
        nativeEvent: event.nativeEvent,
      };
    };

    const startDrawing = (event) => {
      const { offsetX, offsetY } = getCoordinates(event);
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

    const draw = (event) => {
      if (!isDrawing) return;
      if (event.preventDefault) event.preventDefault();

      const { offsetX, offsetY } = getCoordinates(event);
      const context = contextRef.current;
      context.lineWidth = width;
      context.lineCap = "round";
      context.strokeStyle = mode === "erase" ? eraserColor : color;
      context.lineTo(offsetX, offsetY);
      context.stroke();

      if (socket) {
        socket.emit("drawing", {
          boardId,
          x0: lastPosition.current.x,
          y0: lastPosition.current.y,
          x1: offsetX,
          y1: offsetY,
          color,
          width,
          mode,
        });
      }

      lastPosition.current = { x: offsetX, y: offsetY };
    };

    return (
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
        onTouchMove={draw}
        ref={canvasRef}
      />
    );
  }
);

export default Whiteboard;
