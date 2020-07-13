"use strict";

const Conf = require("conf");
const CacheConf = require("cache-conf");
const escapeString = require("escape-string-applescript");
const task = require("@roeybiran/task");

const LaunchBar = module.exports;

LaunchBar.Item = class {
  constructor(
    title,
    subtitle,
    url,
    path,
    icon,
    iconFont,
    iconIsTemplate,
    quickLookURL,
    action,
    actionReturnsItems,
    actionRunsInBackground,
    actionBundleIdentifier,
    actionArgument,
    children
  ) {
    this.title = title;
    this.subtitle = subtitle;
    this.url = url;
    this.path = path;
    this.icon = icon;
    this.iconFont = iconFont;
    this.iconIsTemplate = iconIsTemplate;
    this.quickLookURL = quickLookURL;
    this.action = action;
    this.actionReturnsItems = actionReturnsItems;
    this.actionRunsInBackground = actionRunsInBackground;
    this.actionBundleIdentifier = actionBundleIdentifier;
    this.actionArgument = actionArgument;
    this.children = children;
  }
};

/**
 * output data to LaunchBar.
 */
LaunchBar.output = data => {
  console.log(JSON.stringify(data));
};

/**
 * hides LaunchBar.
 */
LaunchBar.hide = async () => {
  await task.execFile("/usr/bin/osascript", [
    "-e",
    'tell application "LaunchBar" to hide'
  ]);
};

/**
 * keeps LaunchBar active.
 */
LaunchBar.remainActive = async () => {
  await task.execFile("/usr/bin/osascript", [
    "-e",
    'tell application "LaunchBar" to remain active'
  ]);
};

/**
 * @returns {Boolean} true if LaunchBar has keyboard focus, otherwise false.
 */
LaunchBar.hasKeyboardFocus = async () => {
  const result = await task.execFile("/usr/bin/osascript", [
    "-e",
    'tell application "LaunchBar" to return has keyboard focus'
  ]);
  return result === "true";
};

/**
 * sets the clipboard's contents.
 * @param {String} text - the text to copy to the clipboard.
 */
LaunchBar.setClipboardString = async text => {
  await task.execFile("/usr/bin/osascript", [
    "-e",
    `tell application "LaunchBar" to set the clipboard to "${escapeString(
      text
    )}"`
  ]);
};

/**
 * Clears the clipboard's contents.
 */
LaunchBar.clearClipboard = async () => {
  await task.execFile("/usr/bin/osascript", ["-e", 'set the clipboard to ""']);
};

/**
 * Paste text in the frontmost application.
 * @param {String} text - the text to paste.
 */
LaunchBar.paste = async text => {
  await task.execFile("/usr/bin/osascript", [
    "-e",
    `tell application "LaunchBar" to paste in frontmost application "${escapeString(
      text
    )}"`
  ]);
};

/**
 * Perform a macOS service (as seen System Preferences > Keyboard > Shortcuts).
 * @param {String} service - the service to perform.
 * @param {String=} argv - optional arguments to the service.
 */
LaunchBar.performService = async (service, argv) => {
  await task.execFile("/usr/bin/osascript", [
    "-e",
    `tell application "LaunchBar" to perform service "${service}" with string "${escapeString(
      argv
    )}"`
  ]);
};

/**
 * Displays a message in Notification Center.
 * @param {Object} [options]
 * @param {String} [options.text] - the notification's body.
 * @param {String} [options.title=LaunchBar] - the notification's title.
 * @param {String} [options.subtitle] - the notification's subtitle.
 * @param {String} [options.callbackUrl] - URL opened if the user clicks on the notification.
 * @param {Number} [options.afterDelay] - Delay in seconds before the notification is shown.
 */
LaunchBar.displayNotification = async options => {
  let text = "";
  let subtitle = "";
  let callbackUrl = "";
  let afterDelay = 0;
  let title = "LaunchBar";

  if (options) {
    title = escapeString(options.title) || "LaunchBar";
    text = escapeString(options.text) || "";
    subtitle = escapeString(options.subtitle) || "";
    callbackUrl = options.callbackUrl || "";
    afterDelay = options.afterDelay || 0;
  }

  await task.execFile("/usr/bin/osascript", [
    "-e",
    `tell application "LaunchBar" to display in notification center "${text}" ¬
		with title "${title}" ¬
		subtitle "${subtitle}" ¬
		callback URL "${callbackUrl}" ¬
		after delay "${afterDelay}"`
  ]);
};

/**
 * Boilerplate function for text-processing actions.
 * @param {(String|Array)} text - a single string or an array of strings.
 * @param {Function} textProcessingFunction - a function to run over each line. Should accept and return single argument -- a line of text.
 * @param {String} joiner - the separator to join back the lines into a string.
 */

/*
  If sent arguments are strings, LB will most likely consolidate them into a single string argument
  however, it is perfectly reasonable to send paths or other "items" to text-processing actions
  in such cases, arguments are sent as a regular array
 */
LaunchBar.textAction = (
  textArguments,
  textProcessingFunction,
  joiner = "\n"
) => {
  let inputText = textArguments;
  if (typeof inputText === "string") {
    inputText = [inputText];
  }
  const allLines = inputText
    .map(textArgumnet => {
      return textArgumnet.split("\n").map(line => {
        return textProcessingFunction(line);
      });
    })
    .flat();

  if (LaunchBar.env.commandKey) {
    return console.log(
      JSON.stringify(
        allLines.map(x => {
          return { title: x };
        })
      )
    );
  }
  return LaunchBar.paste(allLines.join(joiner));
};

/**
 * @property {string} path - the absolute path the current action's .lbaction package
 * @property {string} cachePath - the absolute path the current action's cache folder (in ~/Library/Caches/at.obdev.LaunchBar/Actions/)
 * @property {string} supportPath - the absolute path the current action's support folder (~/Library/Application Support/LaunchBar/Action Support/)
 * @property {boolean} isDebugLogEnabled - True is this debugging is enabled for this action.
 * @property {string} applicationPath - the absolute path to the LaunchBar.app bundle.
 * @property {string} scriptType - the script's type ("default"/"suggestions" etc.).
 * @property {boolean} commandKey - True is this key was held down when the action was invoked.
 * @property {boolean} alternateKey - True is this key was held down when the action was invoked.
 * @property {boolean} shiftKey - True is this key was held down when the action was invoked.
 * @property {boolean} controlKey - True is this key was held down when the action was invoked.
 * @property {boolean} spaceKey - True is this key was held down when the action was invoked.
 * @property {boolean} actionRunsInBackground - True if the action is running in the background.
 * @property {boolean} isLiveFeedbackEnabled - True is Live Feedback is enabled for this action.
 */
LaunchBar.env = {
  actionPath: process.env.LB_ACTION_PATH,
  cachePath: process.env.LB_CACHE_PATH,
  supportPath: process.env.LB_SUPPORT_PATH,
  isDebugLogEnabled: process.env.LB_DEBUG_LOG_ENABLED === "1",
  applicationPath: process.env.LB_LAUNCHBAR_PATH,
  scriptType: process.env.LB_SCRIPT_TYPE,
  commandKey: process.env.LB_OPTION_COMMAND_KEY === "1",
  alternateKey: process.env.LB_OPTION_ALTERNATE_KEY === "1",
  shiftKey: process.env.LB_OPTION_SHIFT_KEY === "1",
  controlKey: process.env.LB_OPTION_CONTROL_KEY === "1",
  spaceKey: process.env.LB_OPTION_SPACE_KEY === "1",
  actionRunsInBackground: process.env.LB_OPTION_RUN_IN_BACKGROUND === "1",
  isLiveFeedbackEnabled: process.env.LB_OPTION_LIVE_FEEDBACK === "1"
};

/**
 * Persist data in the respective action's "support" directory.
 */
LaunchBar.config = new Conf({
  cwd: LaunchBar.env.supportPath
});

/**
 * Caches an item in the respective action's cache directory.
 */
LaunchBar.cache = new CacheConf({
  configName: "cache",
  cwd: LaunchBar.env.cachePath
});
