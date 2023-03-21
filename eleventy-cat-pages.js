#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import logger from 'cli-logger';
var log = logger();
const APP_NAME = '\nEleventy Category File Generator';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const UNCATEGORIZED_STRING = 'Uncategorized';
const APP_CONFIG_FILE = '11ty-cat-pages.json';
const DATA_FILE = 'category-meta.json';
const ELEVENTY_CONFIG_FILE = '.eleventy.js';
const TEMPLATE_FILE = '11ty-cat-pages.liquid';
var categories = [];
var fileList = [];
function compareFunction(a, b) {
    if (a.category < b.category) {
        return -1;
    }
    if (a.category > b.category) {
        return 1;
    }
    return 0;
}
function directoryExists(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return fs.lstatSync(filePath).isDirectory();
        }
        catch (err) {
            log.error(`checkDirectory error: ${err}`);
            return false;
        }
    }
    return false;
}
function findFilePath(endPath, thePaths) {
    let resStr = path.join(thePaths[thePaths.length - 1], endPath);
    for (var tmpPath of thePaths) {
        let destPath = path.join(tmpPath, endPath);
        log.debug(`Checking ${destPath}`);
        if (directoryExists(destPath)) {
            resStr = destPath;
            break;
        }
    }
    return resStr;
}
function buildConfigObject() {
    const theFolders = ['.', 'src'];
    const dataFolder = findFilePath('_data', theFolders);
    return {
        categoriesFolder: findFilePath('categories', theFolders),
        dataFileName: path.join(dataFolder, DATA_FILE),
        dataFolder: dataFolder,
        postsFolder: findFilePath('posts', theFolders),
        templateFileName: TEMPLATE_FILE
    };
}
console.log(APP_NAME);
console.log(APP_AUTHOR);
const myArgs = process.argv.slice(2);
const debugMode = myArgs.includes('-d');
log.level(debugMode ? log.DEBUG : log.INFO);
log.debug('Debug mode enabled\n');
log.debug(`cwd: ${process.cwd()}`);
let tmpFile = path.join(process.cwd(), ELEVENTY_CONFIG_FILE);
log.info('Validating project folder');
if (!fs.existsSync(tmpFile)) {
    log.error(`Current folder is not an Eleventy project folder. Unable to locate the '${ELEVENTY_CONFIG_FILE}' file.`);
    process.exit(1);
}
log.debug('Project is an Eleventy project folder');
const configFile = path.join(process.cwd(), APP_CONFIG_FILE);
log.info('Locating configuration file');
if (!fs.existsSync(configFile)) {
    log.info(`Configuration file '${APP_CONFIG_FILE}' not found, creating...`);
    let configObject = buildConfigObject();
    if (debugMode)
        console.dir(configObject);
    let outputStr = JSON.stringify(configObject, null, 2);
    log.info(`Writing configuration file ${APP_CONFIG_FILE}`);
    try {
        fs.writeFileSync(path.join('.', APP_CONFIG_FILE), outputStr, 'utf8');
        log.info('Output file written successfully');
    }
    catch (err) {
        log.error(`Unable to write to ${APP_CONFIG_FILE}`);
        console.dir(err);
        process.exit(1);
    }
    process.exit(0);
}
log.debug('Configuration file located, validating');
