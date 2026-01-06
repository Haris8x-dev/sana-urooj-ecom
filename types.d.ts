import { Connection } from "mongoose";

declare global {
    var mongoose: {
        conn: Conenction | null,
        promise: Promise<Connection> | null;
    }
}

export {}