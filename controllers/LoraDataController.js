const { response } = require("express");
const LoraData = require("../models/LoraData");
const { error } = require("console");

//Show the list of Lora Data

const index = (req, res, next) => {
  LoraData.find()
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occured",
      });
    });
};

// show single Lora data
const show = (req, res, next) => {
  let LoraDataID = req.body.ID;
  LoraData.findById(LoraDataID)
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "An error Occured!",
      });
    });
};

// add new LoRa data
const store = (req, res, next) => {
  let loradata = new LoraData({
    ID: req.body.ID,
    status: req.body.status,
  });
  loradata
    .save()
    .then((response) => {
      res.json({
        message: "Data added successfully!",
      });
    })
    .catch((error) => {
      res.json({
        message: "An error Occured",
      });
    });
};

// upadate an LoRa data

const update = (req, res, next) => {
  let LoraDataID = req.body.LoraDataID;

  let updatedData = {
    ID: req.body.ID,
    status: req.body.status,
  };

  LoraData.findByIdAndUpdate(LoraDataID, { $set: updatedData })
    .then(() => {
      res.json({
        message: "Data update succesfully!!",
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occured!!",
      });
    });
};

// Delete an Lora Data
const destroy = (req, res, next) => {
  let LoraDataID = req.body.LoraDataID;
  LoraData.findByIdAndRemove(LoraDataID)
    .then(() => {
      res.json({
        message: "Data deleted succesfully !!",
      });
    })
    .catch((error) => {
      req.json({
        message: "An error occured !",
      });
    });
};

const getRecentDataGroupedByUserId = (req, res) => {
  // Calculate the date 7 days ago from the current date
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  LoraData.aggregate([
    {
      $sort: { createdAt: -1 }, // Sort by timestamp in descending order
    },
    {
      $group: {
        _id: {
          ID: "$ID",
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        avgTemp: { $avg: "$temp" },
        avgHum: { $avg: "$hum" },
        avgAdcVal: { $avg: "$adc_val" },
      },
    },
    {
      $group: {
        _id: "$_id.ID",
        dailyAverages: {
          $push: {
            day: "$_id.day",
            Temparature: "$avgTemp",
            Humidity: "$avgHum",
            Soil: "$avgAdcVal",
          },
        },
      },
    },
    {
      $sort: { _id: 1 }, // Sort _id.ID in ascending order
    },
  ])
    .then((result) => {
      res.json({
        response: result,
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occurred",
        error: error.message,
      });
    });
};

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
  getRecentDataGroupedByUserId,
};
