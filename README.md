# CapstoneProject

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## To Do
Add options to change what data set is represented in map of Virginia
    - add rural percentage option
Connect feedback to database to store feedback
Tests, tests, and more tests!

## Bugs I'm aware of
Buttons on question cards do not reset their selection when a new county is chosen from the dropdown
When data is undefined for ratio (-9999) it appears to be less than all other counties in question card
    - Possible solution is to disable button when that happens

## Sources
`https://www.census.gov/prod/cen2010/cph-2-48.pdf` Percentages of population that live in a rural area by county
