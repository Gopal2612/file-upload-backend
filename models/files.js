const mongoose = require("mongoose");

const filesSchema = mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Files", filesSchema);
