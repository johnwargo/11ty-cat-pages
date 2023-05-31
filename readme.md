# Eleventy Category Pages CLI

Preprocessor for [Eleventy](https://www.11ty.dev/) sites that helps developers implement a categories page with descriptions plus separate paginated pages for each category.

The module is a command-line utility that:

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

To install the command globally, so its available to any project, open a terminal window or command prompt and execute the following command:

```shell
npm install -g eleventy-category-pages-cli
```

Once you complete that step, you have at your disposal a `11ty-cat-pages` command you can use to do all those things described in the opening section. 

To access the module as part of an automated build process in your Eleventy project, open a terminal window or command prompt pointing to your Eleventy project's root folder and execute the following command:

```shell
npm install eleventy-category-pages-cli
```

With this in place you can modify your project's `package.json` file and add the `11ty-cat-pages` command to any of the project's npm scripts.

## Usage

To use this module, you must configure the project with the files it needs to operate; once that's in place, you simply execute the command every time you add a new category to your site and you're all set.

### Create the Template File

Every site will have different content for the category pages, so its up to you to create the template file used by the module. Create the file any way you want using whatever template language you're comfortable with. The general format of the file is:

1. YAML Front matter specifying the layout, pagination, permalink, and so on required for the page.
2. Content describing the page
3. The template code required to render the paginated post list on the page (including previous and next buttons)

Here's an example from [johnwargo.com](https://johnwargo.com):

**File: 11ty-cat-pages.liquid**
```liquid
---
layout: generic
pagination:
  data: collections.post
  size: 20
  alias: catposts
category: 
description: 
eleventyComputed:
  title: "Category: {{ category }}"
permalink: "categories/{{ category | slugify }}/{% if pagination.pageNumber != 0 %}page-{{ pagination.pageNumber }}/{% endif %}"
---

{% include 'pagination-count.html' %}

{{ description }}

<p>This page lists all posts in the category, in reverse chronological order.</p>

<ul class="posts">
  {% for post in catposts %}
    <li>
      <h4>
        <a href="{{post.url}}" style="cursor: pointer">{{ post.data.title }}</a>
      </h4>
      Posted {{ post.date | readableDate }}
      {% if post.data.categories.length > 0 %}
        in
        {% for cat in post.data.categories %}
          <a href="/categories/{{ cat | slugify }}">{{ cat }}</a>
          {%- unless forloop.last %},
          {% endunless %}
        {% endfor %}
      {% endif %}
      <br/>
      {% if post.data.description %}
        {{ post.data.description }}
      {% else %}
        {% excerpt post %}
      {% endif %}
    </li>
  {% endfor %}
</ul>

{% include 'pagination-nav.html' %}
```

> **Note:** The template file front matter must be in YAML format; the module does not understand any other format. 

When you generate category data for your site, the module, for each category, converts the template into a category page that looks like this:

```liquid
---js
{
  "layout": "generic",
  "pagination": {
    "data": "collections.post",
    "size": 20,
    "alias": "catposts",
    "before": function(paginationData, fullData){ return paginationData.filter((item) => item.data.categories.includes('Miscellaneous'));}
  },
  "category": "Miscellaneous",
  "eleventyComputed": {
    "title": "Category: {{ category }}"
  },
  "permalink": "categories/{{ category | slugify }}/{% if pagination.pageNumber != 0 %}page-{{ pagination.pageNumber }}/{% endif %}"
}
---

{% include 'pagination-count.html' %}

{{ description }}

<p>This page lists all posts in the category, in reverse chronological order.</p>

<ul class="posts">
  {% for post in catposts %}
    <li>
      <h4>
        <a href="{{post.url}}" style="cursor: pointer">{{ post.data.title }}</a>
      </h4>
      Posted {{ post.date | readableDate }}
      {% if post.data.categories.length > 0 %}
        in
        {% for cat in post.data.categories %}
          <a href="/categories/{{ cat | slugify }}">{{ cat }}</a>
          {%- unless forloop.last %},
          {% endunless %}
        {% endfor %}
      {% endif %}
      <br/>
      {% if post.data.description %}
        {{ post.data.description }}
      {% else %}
        {% excerpt post %}
      {% endif %}
    </li>
  {% endfor %}
</ul>

{% include 'pagination-nav.html' %}
```

The first thing you'll likely notice is that the module converted the front matter from YAML to JSON format. It did this because the ability to have separate paginated pages requires filtering on the fly to only generate pages for the selected category. The module does this using the Eleventy Pagination `before` callback function. 

The `before` callback allows you to programmatically control the posts included in the pagination data set. The template's front matter must be in JSON format for the Eleventy processing tools to execute the `before` function.

In this example, the module generated the following function which is called before Eleventy starts generating the pagination pages: 

```js
function(paginationData, fullData){ 
  return paginationData.filter((item) => item.data.categories.includes('Miscellaneous'));
}
```

The function essentially returns all of the posts filtered by the category name (which in this case is 'Miscellaneous').

**Note:** I could have used a filter function in the project's `eleventy.config.js` file, but that would have added an additional dependency to make this work. Using the `before` callback eliminates the need to make any changes to the `eleventy.config.js` file.

### Generate the Configuration File

The module uses a simple JSON configuration file to define parameters used when generating content for the site. The first time you execute the command, it will generate the file for you. Open a terminal window or command prompt in your Eleventy project's root folder and execute the following command:

```shell
11ty-cat-pages
```

The module will notice that there's no configuration file in the project folder and prompt you to create it:

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

Type `yes` and press the Enter key, and the module will create the configuration file:

```text
Eleventy Category File Generator
by John M. Wargo (https://johnwargo.com)
Validating project folder
Locating configuration file

Configuration file '11ty-cat-pages.json' not found
Rather than using a bunch of command-line arguments, this tool uses a configuration file instead.
In the next step, the module will automatically create the configuration file for you.
Once it completes, you can edit the configuration file to change the default values and execute the command again.

Create configuration file? Enter yes or no: yes
Writing configuration file 11ty-cat-pages.json
Output file written successfully

Edit the configuration with the correct values for this project and try again.
```

**Note:** The module attempts to locate the different project folders based on how developers set up most Eleventy projects, so the configuration file may be correct for your project.

At this point, you should open the generated configuration file (called `11ty-cat-pages.json`) and ensure that the property values are correct. Here's what the default configuration settings look like for my project:

```json
{
  "categoriesFolder": "src/categories",
  "dataFileName": "category-meta.json",
  "dataFolder": "src/_data",
  "postsFolder": "src/posts",
  "templateFileName": "11ty-cat-pages.liquid"
}
```

The options for this configuration file are described below:

| Property           | Description                                   |
| ------------------ | --------------------------------------------- |
| `categoriesFolder`   | The project source folder where the module places the individual category pages. For navigation simplicity, the module defaults to `categories`. |
| `dataFileName`     | The name of the global data file generated by the module. defaults to `category-meta.json`. |
| `dataFolder`       | The project source folder for global data files. Defaults to `src/_data`. Update this value if you use a different structure for your Eleventy projects. |
| `postsFolder`      | The project source folder for post files. Defaults to `src/posts`. Update this value if you use a different structure for your Eleventy projects. |
| `templateFileName` | The file name of the category template file used to generate category pages. |

With the configuration file and template file in place, you're ready to generate category data and pages.

### Generate the Categories Data and Category Files

To generate the category data file and pages, open a terminal window or command prompt in your Eleventy project's root folder and execute the following command:

```shell
11ty-cat-pages
```

The module will read the configuration file, validate the properties in the file, and generate the necessary files in your project:

```text
Eleventy Category File Generator
by John M. Wargo (https://johnwargo.com)
Validating project folder
Locating configuration file
Configuration file located, validating
Reading template file 11ty-cat-pages.liquid
Reading existing categories file D:\dev\node\11ty-cat-pages\src\_data\category-meta.json
Building file list...
Located 6 files
Building category list...
Deleting unused categories (from previous runs)
Identified 6 categories
Writing categories list to D:\dev\node\11ty-cat-pages\src\_data\category-meta.json
Writing category page: D:\dev\node\11ty-cat-pages\src\categories\cats.liquid
Writing category page: D:\dev\node\11ty-cat-pages\src\categories\dog.liquid
Writing category page: D:\dev\node\11ty-cat-pages\src\categories\turtles.liquid
```

Looking in the project folder, you should now see:

1. The global data file (`category-meta.json` in this example) in the project's `src/_data` folder.
2. A separate file for each category in the `src/category` folder

As shown in the following screenshot:

![Project Folder](https://github.com/johnwargo/11ty-cat-pages/blob/main/images/figure-01.png)

If you look in your project's `src/_data/category-meta.json` file, you should see the categories data file as shown below:

```json
[
  {
    "category": "Cats",
    "count": 1,
    "description": ""
  },
  {
    "category": "Dogs",
    "count": 42,
    "description": ""
  },
  {
    "category": "Turtles",
    "count": 8,
    "description": ""
  }  
]
```

As you can see, the description property is blank for each category. You can edit the file, adding descriptions for each of the categories, your edits won't be overwritten by the module unless you remove all of the posts for the particular category and run the module again.

If you add a new category to the site and re-run the module, the new category appears in the file alongside the existing data:

```json
[
  {
    "category": "Cats",
    "count": 1,
    "description": "Strip steak alcatra filet mignon drumstick, doner ham sausage."
  },
  {
    "category": "Dogs",
    "count": 42,
    "description": "Short loin andouille leberkas ball tip, pork belly pork jowl ham flank turducken meatball brisket beef prosciutto boudin."
  },
  {
    "category": "Ferrets",
    "count": 1,
    "description": ""
  },
  {
    "category": "Turtles",
    "count": 8,
    "description": "Short ribs jowl ground round spare ribs swine tenderloin."
  }  
]
```

**Note:** Descriptions provided by the [Bacon Ipsum Generator](https://baconipsum.com/).

When you open one of the files in the `src/category` folder, you should see a generated category page as described above, one for each category.

## Example Categories Page

As an extra bonus, here's a sample Categories page you can use in your site:

```liquid
---
title: Categories
layout: generic
---

{% assign categories = category-meta | sort %}

<p>View all posts for a particular category by clicking on one of the categories listed below. There are {{ categories.length }} categories on the site today.</p>

<ul class="posts">
  {% for catData in categories %}
    <li>
      <h4>
        <a href="{{ "/" | htmlBaseUrl }}categories/{{ catData.category | slugify }}/">{{ catData.category }}</a>
      </h4>
      Count: {{ catData.count }} |
      {% if catData.description %}
        {{ catData.description }}
      {% endif %}
    </li>
  {% endfor %}
</ul>
```
### Getting Help Or Making Changes

Use [GitHub Issues](https://github.com/johnwargo/11ty-cat-pages/issues) to get help with this module.

Pull Requests gladly accepted, but only with complete documentation of what the change is, why you made it, and why you think its important to have in the module.

*** 

If this code helps you, please consider buying me a coffee.

<a href="https://www.buymeacoffee.com/johnwargo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>