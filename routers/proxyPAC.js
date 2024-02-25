const express = require('express');
const router = express.Router();

const axios = require('axios');
const hpagent = require('hpagent');
const config = require('../config');
let pac = {
  time: new Date().getTime(),
  content: '',
};

router.get('/pac', async (req, res) => {
  try {
    // if the GFW list in the pac cache is available and the timestamp is not expired,
    // get the GFW list from the cache.
    // else get it from the configured URL and save it to cache and set the expiry time
    if (pac.content === '' ||
      pac.time < new Date().getTime() - config.pacExpiry * 60 * 1000) {
      console.log(`${new Date().toISOString()} Fetching proxy list from ${config.listUrl}...`);
      pac.time = new Date().getTime();
      pac.content = await getPacContent();
    }

    sendPacResponse(res);
    console.log(`Proxy auto-config file generated at ${new Date().toISOString()}`);
  } catch (e) {
    console.error(e);
    if (pac.content !== '') {
      sendPacResponse(res);
      console.log(`Error occurred, using cached proxy auto-config file at ${new Date().toISOString()}`);
    } else {
      res.status(e.response?.status || 500).send(
        e.response?.statusText || 'Internal Server Error');
    }
  }
});

function sendPacResponse(res) {
  res.status(200);
  res.setHeader('Content-Type', 'application/x-ns-proxy-autoconfig');
  // res.setHeader('Content-Type', 'text/plain');
  res.send(pac.content);
}

async function getPacContent() {
  const pacBase64 = await getProxyList();
  if (pac.status !== 200) {
    throw new Error(`Failed to generate PAC file, status code: ${pac.status}`);
  }
  const rawData = Buffer.from(pacBase64, 'base64').toString('utf-8');
  const rawList = rawData.split('\n');
  const pacList = [].concat(config.predefined);
  for (const item of rawList) {
    if (item.startsWith('.')) {
      pacList.push(item.slice(1));
    }
    if (item.startsWith('||')) {
      pacList.push(item.slice(2));
    }
  }
  const pacArray = Array.from(new Set(pacList));
  const content = `var proxy_yes = "PROXY ${config.proxy.host}:${config.proxy.port}";
var domains = [${pacArray.map(i => `"${i}"`).join(',')}];
function FindProxyForURL(url, host) {
  if (shExpMatch(url, "${config.exclude}")) {
    return "DIRECT";
  }
  for (var i = 0; i < domains.length; i++) {
    if (dnsDomainIs(host, domains[i])) {
      return proxy_yes;
    }
  }
  return "DIRECT";
}`;
  return content;
}

async function getProxyList() {
  // set the proxy for axios
  const httpsProxyAgent = new hpagent.HttpsProxyAgent({
    proxy: `http://${config.proxy.host}:${config.proxy.port}`
  });
  const response = await axios.get(config.listUrl,
    { httpsAgent: httpsProxyAgent });
  pac.status = response.status;
  if (response.status !== 200) {
    throw new Error(`Failed to fetch proxy list from ${config.listUrl}, status code: ${response.status}`);
  }
  return response.data;
}

module.exports = router;
