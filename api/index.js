const path = require("path");

let appPromise = null;

function getApp() {
  if (!appPromise) {
    const bundlePath = path.join(
      process.cwd(),
      "artifacts",
      "api-server",
      "dist",
      "vercel.mjs"
    );
    appPromise = import(bundlePath).then((m) => m.default);
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
