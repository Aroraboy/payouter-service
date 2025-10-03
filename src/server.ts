import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(router);

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
  console.log(`Payouter service listening on http://localhost:${PORT}`);
});
