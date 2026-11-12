# Design canvas index

The canvas is grouped into pages, and each page has a folder of the same name under `project/`. A board's title starts with its group, so searching the canvas for "Website" or "Accounts" finds every board in it.

To add a board: put the file in the folder for its group, add it to `project/canvas.json` with `"page"` set to that group and a title of the form `Group / Name`.

## 0 Overview

| Board | File |
|---|---|
| Overview | `project/Main.dc.html` |

## 1 Foundations

| Board | File |
|---|---|
| Color | `project/foundations/Color.dc.html` |
| Typography | `project/foundations/Typography.dc.html` |
| Space, shape, depth and motion | `project/foundations/ShapeDepth.dc.html` |
| Icons, app icons and mark | `project/foundations/Icons.dc.html` |
| Data visualisation | `project/foundations/Charts.dc.html` |

## 2 Components and patterns

| Board | File |
|---|---|
| Components | `project/components/Components.dc.html` |
| States and feedback | `project/components/States.dc.html` |
| Experience patterns | `project/components/Patterns.dc.html` |

## 3 Product screens

| Board | File |
|---|---|
| Mail, web | `project/apps/MailWeb.dc.html` |
| Drive, phone, light | `project/apps/DrivePhone.dc.html` |
| Home, phone, dark | `project/apps/HomePhoneDark.dc.html` |

## 4 Website

| Board | File |
|---|---|
| Home page, web (interactive) | `project/website/Landing.dc.html` |
| Type, layout and scroll motion (interactive) | `project/website/WebsiteSystem.dc.html` |
| About (interactive) | `project/website/About.dc.html` |
| Careers (interactive) | `project/website/Careers.dc.html` |

## 5 Accounts and sign-in

| Board | File |
|---|---|
| Sign in and create account, working prototype (interactive) | `project/accounts/Auth.dc.html` |
| Account flows and shared sign-in | `project/accounts/AuthFlow.dc.html` |

## 6 Decisions

| Board | File |
|---|---|
| Decisions, tested | `project/decisions/Decisions.dc.html` |
