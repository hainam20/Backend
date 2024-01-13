const { response } = require("express");
const { error } = require("console");
const ControlData = require("../models/Control");
//Show the list of Lora Data

const index = (req, res, next) => {
  ControlData.find()
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
  let ControlDataID = req.body.ID;
  ControlData.findById(ControlDataID)
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
  let controldata = new ControlData({
    ID: req.body.ID,
    Status: req.body.Status,
  });
  controldata
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
const destroy = (req, res, next) => {
  let ControlDataID = req.body.ID;
  ControlData.findByIdAndRemove(ControlDataID)
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

module.exports = {
  index,
  show,
  store,
  destroy,
};
