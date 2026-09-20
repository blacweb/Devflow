import { io } from 'socket.io-client';
let socket;
export const connect = () => (socket ||= io(import.meta.env.VITE_SOCKET_URL || '/', { auth: (cb) => cb({ token: localStorage.getItem('token') }) }));
export const disconnect = () => { socket?.disconnect(); socket = null; };
