import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "YOUR_SOCKET_SERVER_URL"; // 替换为你的WebSocket服务器地址

let socket: Socket;

export const initiateSocket = () => {
    socket = io(SOCKET_SERVER_URL);
    console.log(`Connecting socket...`);
};

export const disconnectSocket = () => {
    console.log("Disconnecting socket...");
    if (socket) socket.disconnect();
};

export const subscribeToChat = (cb: (msg: any) => void) => {
    if (!socket) return;
    socket.on("chat", (msg: any) => {
        console.log("Websocket event received!");
        return cb(msg);
    });
};

// 添加其他你需要的事件订阅和发送方法