const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const cors = require("cors");

// Route
const LoraDataRoute = require("./routes/LoraData");
const ControlRoute = require("./routes/Control");
const ConditionRoute = require("./routes/Condition");
const events = require("./models/LoraData");
const eventsControl = require("./models/Control");
const eventsCondition = require("./models/Condition");
// const findCondition = require("./handleData/handleCondition");

const app = express();

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

const PORT = process.env.PORT || 5000;

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

//  MongoDB database
const db = mongoose.connection;
let dataArr = [];

db.on("error", (err) => {
  console.log("error connecting to MongoDB", err);
});
db.on("connected", async () => {
  console.log("MongoDB Connected!");
});

/**
 * Config MQTT
 */
// Config MQTT
const client = mqtt.connect("mqtt://mqtt.flespi.io:1883", {
  username: "r5sB4Lo4EbSi6siLzlNkXx6waBsHRU56OnxIWLAoLjuFzCgYLR6zc0TdrbK6WF0A",
  password: "",
});
const topic = "/flespi/qos0";
const topic2 = "/flespi/qos1";

client.on("connect", async () => {
  await mongoose.connect(
    "mongodb+srv://hainam20:20032002nam%40@cluster0.du4h7t4.mongodb.net/LoraDB"
  ),
    { useNewUrlParser: true, useUnifiedTopology: true };
  console.log("MQTT Connected!!");
  client.subscribe(topic);
});

/**
 * Config MongoDB
 */
server.listen(PORT, async () => {
  // Connect MongoDb
  await mongoose.connect(
    "mongodb+srv://hainam20:20032002nam%40@cluster0.du4h7t4.mongodb.net/LoraDB"
  ),
    { useNewUrlParser: true, useUnifiedTopology: true };
  console.log(`app listening on port ${PORT}`);
});

/**
 * Connect Socket.io
 */
io.on("connection", (socket) => {
  console.log("client connected");
  // handle status Relay
  socket.on("status_Relay", async (status) => {
    console.log(status);
    switch (status.ID) {
      case 0:
        if (status.status == true) {
          client.publish(topic2, "0\0");
        } else {
          client.publish(topic2, "1\0");
        }
        break;
      case 1:
        if (status.status == true) {
          client.publish(topic2, "2\0");
        } else {
          client.publish(topic2, "3\0");
        }
        break;
      case 2:
        if (status.status == true) {
          client.publish(topic2, "4\0");
        } else {
          client.publish(topic2, "5\0");
        }
        break;
    }
    await saveControlData(status);
    await sendRelayData();
  });
});

// transmit data via MQTT into Flespi broker
client.on("message", async (topic, message) => {
  console.log("MQTT Received message:", message.toString());
  let count = 0;
  let data = message.toString();
  data = JSON.parse(data);
  if (data) {
    count++;
    dataArr.push(data);
  }
  if (dataArr.length === 3) {
    await saveData(data);
    await io.emit("mqtt_data", dataArr);
    dataArr = [];
  }
  const condition = await findCondition(data.ID);
  handleCondition(condition, data);
});

// Websocket
saveData = async (data) => {
  data = new events(data);
  data = await data.save();
};
saveControlData = async (data) => {
  data = new eventsControl(data);
  data = await data.save();
};
const findCondition = async (ID) => {
  const data = await eventsCondition
    .find({ ID: ID })
    .limit(1)
    .sort({ createdAt: -1 })
    .catch((error) => {
      console.log(error);
    });
  return data;
};

const handleCondition = (conditon, data) => {
  if (conditon[0].mode === "Automatic") {
    if (conditon[0].tempState.state === true) {
      if (data.adc_val < conditon[0].tempState.value) {
        client.publish(topic2, "0\0");
        console.log(data.adc_val, conditon[0].tempState.value);
      }
    }
    if (conditon[0].soilState.state === true) {
      if (data.adc_val > conditon[0].tempState.value) {
        client.publish(topic2, "0\0");
        console.log(data.adc_val, conditon[0].tempState.value);
      }
    }
    if (conditon[0].waterState.state === true) {
      if (data.temp > conditon[0].waterState.value) {
        client.publish(topic2, "0\0");
        console.log(data.temp, conditon[0].tempState.value);
      }
    }
  }
};

sendRelayData = async () => {
  try {
    const relayData = await eventsControl
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();
    io.emit("relay_data", relayData);
  } catch (error) {
    console.error("Error fetching relay data:", error);
  }
};
app.use("/api/condition", ConditionRoute);
app.use("/api/loradata", LoraDataRoute);
app.use("/api/control", ControlRoute);
