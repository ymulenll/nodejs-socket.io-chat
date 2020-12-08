const express = require("express");
const app = express();
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/user.model");
const Message = require("./models/message.model");

const PORT = process.env.PORT || 3100;
const MONGODB_CONNECTION =
  process.env.MONGODB_CONNECTION || "mongodb://localhost/hachat";

mongoose.connect(MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

mongoose.connection.once("open", () =>
  console.log("Conexión establecida a la base de datos")
);

mongoose.connection.on("error", () => {
  console.log("Error en la conexión a la base de datos");
});

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.get("/messages", async (req, res) => {
  const messages = await Message.find()
    .select("-_id -__v -updatedAt")
    .populate("user", "-_id username");

  res.json(messages);
});

const server = app.listen(PORT, () =>
  console.log(`Servidor corriendo en el puerto ${PORT}`)
);

const io = socketIO(server);

io.on("connection", (socket) => {
  socket.username = "";
  console.log("conectado: " + socket.id);

  socket.on("disconnect", () => console.log("desconectado: " + socket.id));

  socket.on("new-message", async (msg) => {
    try {
      // crear mensaje
      const message = await Message.create({
        text: msg,
      });

      // asociar mensaje al usuario
      const user = await User.findOneAndUpdate(
        { username: socket.username },
        { $push: { messages: message.id } },
        { upsert: true, new: true }
      );

      // asociar usuario al mensaje
      message.user = user.id;
      await message.save();

      const payload = await message
        .populate("user", "-_id username")
        .execPopulate();

      // enviar a todos los sockets conectados
      console.log(payload);
      io.emit("new-message-ok", payload);
    } catch (error) {
      socket.emit("new-message-error", error.message);
    }
  });

  socket.on("set-username", async (username) => {
    try {
      const user = await User.findOneAndUpdate(
        { username },
        { username },
        { upsert: true, new: true }
      );

      socket.username = user.username;

      console.log(user);
      socket.emit("set-username-ok", error.message);
    } catch (error) {
      socket.emit("set-username-error", error.message);
    }
  });
});
