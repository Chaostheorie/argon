const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Config {
  constructor(args) {
    // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
    // app.getPath('userData') will return a string of the user's app data directory path.
    // So don't construct it from the renderer and instead get global.config
    this.userDataPath = (electron.app || electron.remote.app).getPath('userData');
    // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
    this.path = path.join(this.userDataPath, args.configName + '.json');
    // Load data from file
    this.data = parseDataFile(this.path, args.defaults);
  }

  // This will just return the property on the `data` object
  get(key) {
    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  // ...and this will eventually delete it
  remove(key) {
    var res = delete this.data[key];
    fs.writeFileSync(this.path, JSON.stringify(this.data));
    return res;
    // delete is far slower than just setting undefined
    // but may cause problems with the JSON parser
  }
}

function parseDataFile(filePath, defaults) {
  // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
  // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    // if there was some kind of error, return the passed in defaults instead.
    return defaults;
  }
}

// export the class
export { Config };
