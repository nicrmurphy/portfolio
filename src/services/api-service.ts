import { io } from "socket.io-client";

type BoardData = { fenString: string };
export type GameState = { roomCode: string; fenString: string; playerColor: number; opponentColor: number };
export type MoveData = { id: number; prevIndex: number; newIndex: number; fenString: string };

/**
 *
 * @returns A socket connection to the server
 */
export const connectToGameServer = (code?: string) => {
  const socket = io(import.meta.env.VITE_WS_URL);

  socket.emit("join", { code });
  socket.on("error", (err) => console.error(err));
  return socket;
};

export class GameServerConnection {
  private socket = io(import.meta.env.VITE_WS_URL);
  public isActive = (): boolean => this.socket.active;
  public isConnected = (): boolean => this.socket.connected;
  public onOpponentMove: (...args: any[]) => void = () => {};
  public onOpponentResign: (...args: any[]) => void = () => {};

  constructor() {
    this.socket.on("move", (data) => this.onOpponentMove(data));
    this.socket.on("resign", (data) => this.onOpponentResign(data));
  }

  joinRoom = async (code: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.socket.on("join-error", (err) => {
        reject(err);
        this.socket.removeListener("join-error");
      });
      this.socket.on("join", ({ fenString }: BoardData) => resolve(fenString));
      this.socket.emit("join", { code });
    });
  };

  createRoom = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.socket.emit("new-room");
      this.socket.on("join", ({ code }: { code: string }) => resolve(code));
    });
  };

  opponentPlayerJoin = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.socket.on("join", () => resolve());
    });
  };

  gameStarted = async (): Promise<GameState> => {
    return new Promise((resolve, reject) => {
      this.socket.on("start", (data: GameState) => {
        resolve(data);
      });
    });
  };

  sendStartGame = (data: GameState): void => {
    this.socket.emit("start", data);
  };

  sendMove = (data: { gameState: GameState; moveData: MoveData }): void => {
    this.socket.emit("move", data);
  };

  sendResign = (data: GameState): void => {
    this.socket.emit("resign", data);
  };

  disconnect = (): void => {
    this.socket.disconnect();
  };
}
