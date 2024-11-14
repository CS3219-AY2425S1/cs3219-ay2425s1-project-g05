import mongoose from "mongoose";

const isValidObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return false;
  }
  return true;
};

export { isValidObjectId };
