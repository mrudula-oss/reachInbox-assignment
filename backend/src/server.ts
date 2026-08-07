import app from "./app";
import "./workers/email.worker";
import { port } from "./config";


app.listen(port, () => {
  console.log(`[ReachInbox-V2] Server is running exactly on http://localhost:${port}`);
});