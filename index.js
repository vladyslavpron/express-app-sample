import express from "express";
import morgan from "morgan";
import * as dotEnv from "dotenv";
import * as passport from "passport";
import * as session from "express-session";
import cors from "cors";
import { myStore } from "./models/dbInit";

import logger from "./winston";
import { AppError, NotFoundError, ForbiddenError } from "./utils/errors";

import {
  stripeRouter,
  stripeWebhookRouter,
} from "./controllers/stripeController";
import { authRouter } from "./controllers/authController";
import { passwordRouter } from "./controllers/passwordController";
import { userRouter } from "./controllers/userController";
import { uploadRouter } from "./controllers/uploadController";
import { recognizeRouter } from "./controllers/recognizeController";
import { fileRouter } from "./controllers/fileController";
import { textRouter } from "./controllers/textController";
import { contactRouter } from "./controllers/contactController";
import { contactListRouter } from "./controllers/contactListController";
import { dashboardRouter } from "./controllers/dashboardController";
import { faqRouter } from "./controllers/faqController";
import { notificationRouter } from "./controllers/notificationController";
import { utilsRouter } from "./controllers/utilsController";

dotEnv.config();

const app = express();
app.use(morgan("dev"));
app.use(cors());

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    store: myStore,
    cookie: {
      path: "/",
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use("/stripe-webhook", stripeWebhookRouter);

app.use(express.json());

app.use("/stripe", stripeRouter);
app.use("/auth", authRouter);
app.use("/password", passwordRouter);
app.use("/user", userRouter);
app.use("/upload", uploadRouter);
app.use("/recognize", recognizeRouter);
app.use("/", fileRouter);
app.use("/text", textRouter);
app.use("/contacts", contactRouter);
app.use("/lists", contactListRouter);
app.use("/dashboard", dashboardRouter);
app.use("/faq", faqRouter);
app.use("/notifications", notificationRouter);
app.use("/utils", utilsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// eslint-disable-next-line
app.use((err, req, res, next) => {
  logger.error(err.stack);
  if (err instanceof AppError) {
    if (err instanceof ForbiddenError) {
      return res.status(403).json({ message: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
});

(async () => {
  try {
    app.listen(8080);
  } catch (err) {
    console.error(`Error on server startup: ${err.message}`);
  }
})();
