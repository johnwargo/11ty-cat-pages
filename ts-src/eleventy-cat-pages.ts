#!/usr/bin/env node

/** 
 * Eleventy Category File Generator
 * by John M. Wargo (https://johnwargo.com)
 * Created March 20, 2023
 */

// TODO: Convert config file slashes to unix delimeters
// TODO: Prompt the user before creating the config file
// TODO: Write all log output to a file
// TODO: Import package.json file for version number

import fs from 'fs-extra';
import path from 'path';
import { parseAllDocuments } from 'yaml';

//@ts-ignore
import logger from 'cli-logger';
var log = logger();

// project modules
import { CategoryRecord, ConfigObject, ConfigValidation, ProcessResult } from './types';

const APP_NAME = '\nEleventy Category File Generator';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const APP_CONFIG_FILE = '11ty-cat-pages.json';
const DATA_FILE = 'category-meta.json';
const ELEVENTY_CONFIG_FILE = '.eleventy.js';
const TEMPLATE_FILE = '11ty-cat-pages.liquid';
const UNCATEGORIZED_STRING = 'Uncategorized';

var categories: CategoryRecord[] = [];
var fileList: String[] = [];

// ====================================
// Functions
// ====================================

function compareFunction(a: any, b: any) {
  if (a.category < b.category) {
    return -1;
  }
  if (a.category > b.category) {
    return 1;
  }
  return 0;
}

async function validateConfig(validations: ConfigValidation[]): Promise<ProcessResult> {

  var processResult: ProcessResult;

  processResult = {
    result: true, message: 'Configuration file errors:\n'
  };

  for (var validation of validations) {
    log.debug(`Validating '${validation.filePath}'`);
    if (validation.isFolder) {
      if (!directoryExists(validation.filePath)) {
        processResult.result = false;
        processResult.message += `\nThe '${validation.filePath}' folder is required, but does not exist.`;
      }
    } else {
      if (!fs.existsSync(validation.filePath)) {
        processResult.result = false;
        processResult.message += `\nThe '${validation.filePath}' file is required, but does not exist.`;
      }
    }
  }
  return processResult;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[]) {
  var files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function (file: string) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(process.cwd(), dirPath, file));
    }
  });
  return arrayOfFiles
}

function getFileList(filePath: string, debugMode: boolean): String[] {
  if (debugMode) console.log();
  log.info('Building file list...');
  log.debug(`filePath: ${filePath}`);
  return getAllFiles(filePath, []);
}

function buildCategoryList(
  categories: CategoryRecord[],
  fileList: String[],
  debugMode: boolean
): CategoryRecord[] {

  if (debugMode) console.log();
  log.info('Building category list...');
  for (var fileName of fileList) {
    log.debug(`Parsing ${fileName}`);
    // Read the post file
    var postFile = fs.readFileSync(fileName.toString(), 'utf8');
    // Get the first YAML block from the file
    var content = JSON.parse(JSON.stringify(parseAllDocuments(postFile, { logLevel: 'silent' })));
    // Does the post have a category?
    if (content[0].categories) {
      // Yes, get the categories property
      var categoriesString = content[0].categories.toString();
    } else {
      categoriesString = UNCATEGORIZED_STRING;
    }

    // split the category list into an array
    var catArray = categoriesString.split(',');
    // loop through the array
    for (var cat of catArray) {
      var category = cat.trim();  // Remove leading and trailing spaces        
      // Does the category already exist in the list?
      var index = categories.findIndex((item) => item.category === category);
      if (index < 0) {
        log.info(`Found category: ${category}`);
        // add the category to the list
        categories.push({ category: category, count: 1, description: '' });
      } else {
        // increment the count for the category
        categories[index].count++;
      }
    }

  }
  return categories;
}

function directoryExists(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    try {
      return fs.lstatSync(filePath).isDirectory();
    } catch (err) {
      log.error(`checkDirectory error: ${err}`);
      return false;
    }
  }
  return false;
}

function findFilePath(endPath: string, thePaths: string[]): string {
  // set the default value, the last path in the array
  let resStr = path.join(thePaths[thePaths.length - 1], endPath);
  for (var tmpPath of thePaths) {
    let destPath: string = path.join(tmpPath, endPath);
    log.debug(`Checking ${destPath}`);
    if (directoryExists(destPath)) {
      resStr = destPath;
      break;
    }
  }
  return resStr;
}

function buildConfigObject(): ConfigObject {
  const theFolders: string[] = ['.', 'src'];
  const dataFolder = findFilePath('_data', theFolders);
  return {
    categoriesFolder: findFilePath('categories', theFolders),
    dataFileName: path.join(dataFolder, DATA_FILE),
    dataFolder: dataFolder,
    postsFolder: findFilePath('posts', theFolders),
    templateFileName: TEMPLATE_FILE
  }
}

// ====================================
// Start Here!
// ====================================

console.log(APP_NAME);
console.log(APP_AUTHOR);
// console.log(`Version ${packageDotJSON.version} ${APP_AUTHOR}\n`);

// do we have command-line arguments?
const myArgs = process.argv.slice(2);
const debugMode = myArgs.includes('-d');

// set the logger log level
log.level(debugMode ? log.DEBUG : log.INFO);
log.debug('Debug mode enabled\n');
log.debug(`cwd: ${process.cwd()}`);

// is it an Eleventy project?
let tmpFile = path.join(process.cwd(), ELEVENTY_CONFIG_FILE);
log.info('Validating project folder');
if (!fs.existsSync(tmpFile)) {
  log.error(`Current folder is not an Eleventy project folder. Unable to locate the '${ELEVENTY_CONFIG_FILE}' file.`);
  process.exit(1);
}
log.debug('Project is an Eleventy project folder');

// does the config file exist?
const configFile = path.join(process.cwd(), APP_CONFIG_FILE);
log.info('Locating configuration file');
if (!fs.existsSync(configFile)) {
  log.info(`Configuration file '${APP_CONFIG_FILE}' not found, creating...`);
  // create the configuration file  
  let configObject = buildConfigObject();
  if (debugMode) console.dir(configObject);
  let outputStr = JSON.stringify(configObject, null, 2);
  log.info(`Writing configuration file ${APP_CONFIG_FILE}`);
  try {
    fs.writeFileSync(path.join('.', APP_CONFIG_FILE), outputStr, 'utf8');
    log.info('Output file written successfully');
  } catch (err: any) {
    log.error(`Unable to write to ${APP_CONFIG_FILE}`);
    console.dir(err);
    process.exit(1);
  }
  process.exit(0);
}

// Read the config file
log.info('Configuration file located, validating');
const configFilePath = path.join(process.cwd(), APP_CONFIG_FILE);
if (!fs.existsSync(configFilePath)) {
  log.error(`Unable to locate the configuration file '${APP_CONFIG_FILE}'`);
  process.exit(1);
}

let configData = fs.readFileSync(configFilePath, 'utf8');
const configObject: ConfigObject = JSON.parse(configData);

// we'll create this file when we write it
// { filePath: configObject.dataFileName, isFolder: false },
const validations: ConfigValidation[] = [
  { filePath: configObject.categoriesFolder, isFolder: true },
  { filePath: configObject.dataFolder, isFolder: true },
  { filePath: configObject.postsFolder, isFolder: true },
  { filePath: configObject.templateFileName, isFolder: false }
];

validateConfig(validations)
  .then((res: ProcessResult) => {
    if (res.result) {

      // read the template file
      log.info(`Reading template file ${configObject.templateFileName}`);
      let templateFile = fs.readFileSync(configObject.templateFileName, 'utf8');

      let categories: CategoryRecord[] = [];
      // Read the existing categories file
      let categoryFile = path.join(process.cwd(), configObject.dataFileName);
      if (fs.existsSync(categoryFile)) {
        log.info(`Reading existing categories file ${configObject.dataFileName}`);
        let categoryData = fs.readFileSync(categoryFile, 'utf8');
        categories = JSON.parse(categoryData);
        // zero out all of the categories
        if (categories.length > 0) categories.forEach((item) => item.count = 0);
        if (debugMode) console.table(categories);
      } else {
        log.info('Category data file not found, will create a new one');
      }

      fileList = getFileList(configObject.postsFolder, debugMode);
      if (fileList.length < 1) {
        log.error('\nNo Post files found in the project, exiting');
        process.exit(0);
      }

      log.info(`Located ${fileList.length} files`);
      if (debugMode) console.dir(fileList);

      // build the categories list
      categories = buildCategoryList(categories, fileList, debugMode);
      // do we have any categories?
      if (categories.length > 0) {
        // Delete any with a count of 0
        log.info('Deleting unused categories (from previous runs)');
        categories = categories.filter((item) => item.count > 0);
      }
      log.info(`Identified ${categories.length} categories`);
      categories = categories.sort(compareFunction);
      if (debugMode) console.table(categories);

      var outputPath: string = path.join(process.cwd(), configObject.dataFileName);
      log.info(`Writing categories list to ${outputPath}`);
      try {
        fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2), 'utf8');
      } catch (err) {
        console.log('Error writing file');
        console.error(err)
        process.exit(1);
      }

      // empty the categories folder, just in case there are old categories there
      const categoriesFolder = path.join(process.cwd(), configObject.categoriesFolder);
      log.debug(`Emptying categories folder: ${categoriesFolder}`);
      fs.emptyDirSync(categoriesFolder);

      // create separate pages for each category
      categories.forEach(function (item) {
        // why would this ever happen?
        if (item.category === "")
          return;        
        let catPage = path.join(categoriesFolder, item.category.toLowerCase().replace(' ', '-') + ".md");
        log.debug(`Writing category page: ${catPage}`);
        fs.writeFileSync(catPage, templateFile);
      });
    } else {
      log.error(res.message);
      process.exit(1);
    }
  })
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });