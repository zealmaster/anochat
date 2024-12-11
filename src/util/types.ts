export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

export type Message = {
  sender: string;
  receiver: string;
  message: string;
  createdAt: Date;
};

export type Contact = {
  user: string;
  contact: string;
  createdAt: Date;
};

export interface ChatQuery {
  sender: string;
  receiver: string;
}
