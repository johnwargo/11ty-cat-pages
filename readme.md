# Eleventy Category Pages

Preprocessor for [Eleventy](https://www.11ty.dev/) sites:

1. Recursively reads all the posts in a specified directory 
2. Generates a global data file containing a JSON object representing the list of categories with the following properties:
  1. Category Name
  2. Description
  3. Post count (for the category)
3. 




D:\dev\node\11ty-cat-pages>11ty-cat-pages
```text
Eleventy Category File Generator
by John M. Wargo (https://johnwargo.com)
Validating project folder
Locating configuration file

Configuration file '11ty-cat-pages.json' not found
Rather than using a bunch of command-line arguments, this tool uses a configuration file instead.
In the next step, the module will automatically create the configuration file for you.
Once it completes, you can edit the configuration file to change the default values and execute the command again.

Create configuration file? Enter yes or no:
```



```json
{
  "categoriesFolder": "src/categories",
  "dataFileName": "src/_data/category-meta.json",
  "dataFolder": "src/_data",
  "postsFolder": "src/posts",
  "templateFileName": "11ty-cat-pages.liquid"
}
```



## Notes to self

Pretty printing data in terminal: https://lars-waechter.gitbook.io/voici.js/