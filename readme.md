# Eleventy Category Pages

Preprocessor for [Eleventy](https://www.11ty.dev/) sites that:

1. Recursively reads all the posts in a specified directory 
2. Generates a global data file containing a JSON object representing the list of categories with the following properties:
    * Category Name
    * Description
    * Post count (for the category)
3. Using a provided template document as a guide, creates a separate content file for each category's content

What this allows you to do is:

1. Create a categories page for your site that lists all of your site's categories in alphabetical order with:
    * A link to the generated category page
    * A description for the category
    * The number of posts in the category
2. Create a separate page for each category with pagination of the articles in the category

## Background

Eleventy (today) doesn't allow you to generate nested pages with pagination at both levels (parent (categories) and child (category) for example). If you want to have a categories page with a paginated list of the posts within the category you have to either manually create separate files for your category pages manually or hack something together programmatically to do it for you. This module does the latter through a simple command-line command, a configuration file, and category page template.

## Installation


## Usage




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