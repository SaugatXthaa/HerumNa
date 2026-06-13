import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { createAddonRouter } from "./addon/router.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_PATH = process.env.BASE_PATH ?? "";
const addonBasePath = `${BASE_PATH}/addon`;

app.use("/api", router);
app.use("/addon", createAddonRouter(addonBasePath));

app.get("/", (_req, res) => {
  res.redirect("/addon/configure");
});

export default app;
