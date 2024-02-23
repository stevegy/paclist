const express = require('express');
const router = express.Router();

router.get('/proxy.pac', (req, res) => {
  // if the GFW list on the disk file is available and the timestamp is not expired.
  // get the GFW list from the disk file
  // else get it from the configured URL and save it to disk file and set the expiry time
  
});


module.exports = router;
