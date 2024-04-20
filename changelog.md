# Changelog

## 20240420

Fixed an error where a category without a description was assigned the description from another catrgory.

## 20230530

Breaking change (sorry) Changed `category` to `categories` in the configuration file to align this with how it works in johnwargo.com (and makes more sense syntactically anyway)

## 20230525

Replaced the yesno module with prompts - implements a cleaner prompt to create the configuration file

## 20230521

Fixed an issue where the module wouldn't generate the Uncategorized entry if the categories property existed but was empty.

## 20230505

Added sort to generated `before` function to sort in reverse chronological order 

## 20230426

Added copying the category description to the generated document.