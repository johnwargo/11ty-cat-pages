#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';
import yesno from 'yesno';
import logger from 'cli-logger';
var log = logger();
const APP_NAME = '\nEleventy Category File Generator';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const APP_CONFIG_FILE = '11ty-cat-pages.json';
const DATA_FILE = 'category-meta.json';
const ELEVENTY_FILES = ['.eleventy.js', 'eleventy.config.js'];
const TEMPLATE_FILE = '11ty-cat-pages.liquid';
const UNCATEGORIZED_STRING = 'Uncategorized';
const YAML_PATTERN = /---[\r\n].*?[\r\n]---/s;
var fileList = [];
var templateExtension;
function checkEleventyProject() {
    log.info('Validating project folder');
    let result = false;
    ELEVENTY_FILES.forEach((file) => {
        let tmpFile = path.join(process.cwd(), file);
        if (fs.existsSync(tmpFile)) {
            result = true;
        }
    });
    return result;
}
function compareFunction(a, b) {
    if (a.category < b.category) {
        return -1;
    }
    if (a.category > b.category) {
        return 1;
    }
    return 0;
}
async function validateConfig(validations) {
    var processResult;
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
        }
        else {
            if (!fs.existsSync(validation.filePath)) {
                processResult.result = false;
                processResult.message += `\nThe '${validation.filePath}' file is required, but does not exist.`;
            }
        }
    }
    return processResult;
}
function getAllFiles(dirPath, arrayOfFiles) {
    var files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        }
        else {
            arrayOfFiles.push(path.join(process.cwd(), dirPath, file));
        }
    });
    return arrayOfFiles;
}
function getFileList(filePath, debugMode) {
    if (debugMode)
        console.log();
    log.info('Building file list...');
    log.debug(`filePath: ${filePath}`);
    return getAllFiles(filePath, []);
}
function buildCategoryList(categories, fileList, debugMode) {
    if (debugMode)
        console.log();
    log.info('Building category list...');
    for (var fileName of fileList) {
        log.debug(`Parsing ${fileName}`);
        if (path.extname(fileName.toString().toLocaleLowerCase()) !== '.json') {
            var postFile = fs.readFileSync(fileName.toString(), 'utf8');
            var YAMLDoc = YAML.parseAllDocuments(postFile, { logLevel: 'silent' });
            var content = YAMLDoc[0].toJSON();
            if (debugMode)
                console.dir(content);
            if (content.categories) {
                var categoriesString = content.categories.toString();
            }
            else {
                categoriesString = UNCATEGORIZED_STRING;
            }
            var catArray = categoriesString.split(',');
            for (var cat of catArray) {
                var category = cat.trim();
                var index = categories.findIndex((item) => item.category === category);
                if (index < 0) {
                    log.info(`Found category: ${category}`);
                    categories.push({ category: category, count: 1, description: '' });
                }
                else {
                    categories[index].count++;
                }
            }
        }
        else {
            log.info(`Skipping ${fileName}`);
        }
    }
    return categories;
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
    return {
        categoriesFolder: findFilePath('categories', theFolders),
        dataFileName: DATA_FILE,
        dataFolder: findFilePath('_data', theFolders),
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
if (!checkEleventyProject()) {
    log.error('Current folder is not an Eleventy project folder.');
    process.exit(1);
}
log.debug('Project is an Eleventy project folder');
const configFile = path.join(process.cwd(), APP_CONFIG_FILE);
log.info('Locating configuration file');
if (!fs.existsSync(configFile)) {
    log.info(`\nConfiguration file '${APP_CONFIG_FILE}' not found`);
    log.info('Rather than using a bunch of command-line arguments, this tool uses a configuration file instead.');
    log.info('In the next step, the module will automatically create the configuration file for you.');
    log.info('Once it completes, you can edit the configuration file to change the default values and execute the command again.');
    await yesno({
        question: '\nCreate configuration file? Enter yes or no:',
        defaultValue: false,
        yesValues: ['Yes'],
        noValues: ['No']
    }).then((confirmExport) => {
        if (confirmExport) {
            let configObject = buildConfigObject();
            if (debugMode)
                console.dir(configObject);
            let outputStr = JSON.stringify(configObject, null, 2);
            outputStr = outputStr.replace(/\\/g, '/');
            outputStr = outputStr.replaceAll('//', '/');
            log.info(`Writing configuration file ${APP_CONFIG_FILE}`);
            try {
                fs.writeFileSync(path.join('.', APP_CONFIG_FILE), outputStr, 'utf8');
                log.info('Output file written successfully');
                log.info('\nEdit the configuration with the correct values for this project then execute the command again.');
            }
            catch (err) {
                log.error(`Unable to write to ${APP_CONFIG_FILE}`);
                console.dir(err);
                process.exit(1);
            }
            process.exit(0);
        }
        else {
            log.info('Exiting...');
            process.exit(0);
        }
    });
}
log.info('Configuration file located, validating');
const configFilePath = path.join(process.cwd(), APP_CONFIG_FILE);
if (!fs.existsSync(configFilePath)) {
    log.error(`Unable to locate the configuration file '${APP_CONFIG_FILE}'`);
    process.exit(1);
}
let configData = fs.readFileSync(configFilePath, 'utf8');
const configObject = JSON.parse(configData);
const validations = [
    { filePath: configObject.categoriesFolder, isFolder: true },
    { filePath: configObject.dataFolder, isFolder: true },
    { filePath: configObject.postsFolder, isFolder: true },
    { filePath: configObject.templateFileName, isFolder: false }
];
validateConfig(validations)
    .then((res) => {
    if (res.result) {
        log.info(`Reading template file ${configObject.templateFileName}`);
        let templateFile = fs.readFileSync(configObject.templateFileName, 'utf8');
        let templateDoc = YAML.parseAllDocuments(templateFile, { logLevel: 'silent' });
        let frontmatter = JSON.parse(JSON.stringify(templateDoc))[0];
        if (debugMode)
            console.dir(frontmatter);
        if (!frontmatter.pagination) {
            log.error('The template file does not contain the pagination frontmatter');
            process.exit(1);
        }
        templateExtension = path.extname(configObject.templateFileName);
        let categories = [];
        let categoriesFile = path.join(process.cwd(), configObject.dataFolder, configObject.dataFileName);
        if (fs.existsSync(categoriesFile)) {
            log.info(`Reading existing categories file ${categoriesFile}`);
            let categoryData = fs.readFileSync(categoriesFile, 'utf8');
            categories = JSON.parse(categoryData);
            if (categories.length > 0)
                categories.forEach((item) => item.count = 0);
            if (debugMode)
                console.table(categories);
        }
        else {
            log.info('Category data file not found, will create a new one');
        }
        fileList = getFileList(configObject.postsFolder, debugMode);
        if (fileList.length < 1) {
            log.error('\nNo Post files found in the project, exiting');
            process.exit(0);
        }
        log.info(`Located ${fileList.length} files`);
        if (debugMode)
            console.dir(fileList);
        categories = buildCategoryList(categories, fileList, debugMode);
        if (categories.length > 0) {
            log.info('Deleting unused categories (from previous runs)');
            categories = categories.filter((item) => item.count > 0);
        }
        log.info(`Identified ${categories.length} categories`);
        categories = categories.sort(compareFunction);
        if (debugMode)
            console.table(categories);
        log.info(`Writing categories list to ${categoriesFile}`);
        try {
            fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), 'utf8');
        }
        catch (err) {
            console.log('Error writing file');
            console.error(err);
            process.exit(1);
        }
        const categoriesFolder = path.join(process.cwd(), configObject.categoriesFolder);
        log.debug(`Emptying categories folder: ${categoriesFolder}`);
        fs.emptyDirSync(categoriesFolder);
        categories.forEach(function (item) {
            if (item.category === "")
                return;
            log.debug(`\nProcessing category: ${item.category}`);
            let pos1 = templateFile.search(YAML_PATTERN);
            if (pos1 > -1) {
                frontmatter.category = item.category;
                if (item.category == UNCATEGORIZED_STRING) {
                    frontmatter.pagination.before = `function(paginationData, fullData){ return paginationData.filter((item) => item.data.categories.length == 0);}`;
                }
                else {
                    frontmatter.pagination.before = `function(paginationData, fullData){ return paginationData.filter((item) => item.data.categories.includes('${item.category}'));}`;
                }
                let tmpFrontmatter = JSON.stringify(frontmatter, null, 2);
                tmpFrontmatter = tmpFrontmatter.replace(`"${frontmatter.pagination.before}"`, frontmatter.pagination.before);
                tmpFrontmatter = `---js\n${tmpFrontmatter}\n---`;
                let newFrontmatter = templateFile.replace(YAML_PATTERN, tmpFrontmatter);
                let outputFileName = path.join(categoriesFolder, item.category.toLowerCase().replaceAll(' ', '-') + templateExtension);
                log.info(`Writing category page: ${outputFileName}`);
                fs.writeFileSync(outputFileName, newFrontmatter);
            }
            else {
                log.error('Unable to match frontmatter in template file');
                process.exit(1);
            }
        });
    }
    else {
        log.error(res.message);
        process.exit(1);
    }
})
    .catch((err) => {
    log.error(err);
    process.exit(1);
});
