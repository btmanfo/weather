const express = require("express");
const { CANDIDATE_NAME, PMA_DESCRIPTION } = require("../config/meta");

const router = express.Router();

router.get("/meta", (req, res) => {
  res.json({
    candidateName: CANDIDATE_NAME,
    pmaDescription: PMA_DESCRIPTION,
  });
});

module.exports = router;
