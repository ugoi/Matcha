/**
 * Create HTTP server.
 */

import { createServer } from "http";
import app from "../app.js";

var server = createServer(app);

export { server };
