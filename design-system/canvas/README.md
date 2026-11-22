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

## 4 Sign-in and onboarding

Sign-in, personal sign-up, business sign-up and the first admin sign-in ("Daylight"). Each screen is drawn four times: desktop light (the plain name), `Dark`, `Mobile` and `MobileDark`.

| Folder | What it holds | Screens |
|---|---|---|
| `project/accounts/` | The design brief: principles and house rules | DaylightBrief |
| `project/accounts/flow/` | The working prototype (`Prototype.dc.html`) and thin wrappers that open it at sign-in, personal, business, dark and mobile | Prototype, PrototypeSignIn, PrototypeBusiness |
| `project/accounts/screens/signin/` | Sign in: email, password, passkey, code, account chooser, recovery and help | 11: Chooser, Email, Passkey, Password, Code, Recover, Rcode, Newpass, Help, Helpsent, Done |
| `project/accounts/screens/personal/` | Personal account creation, step by step | 15: Type, Name, Birth, Address, Ownemail, Owncode, Passkey, Password, Addpasskey, Recovery, Code, Review, Creating, Ready, Contact |
| `project/accounts/screens/business/` | Business (workspace) creation: business details, domain, plan, checkout, administrator | 13: Start, You, Domainq, Domain, Domainok, Find, Registrant, Admin, Plan, Checkout, Cardotp, Creating, Ready |
| `project/accounts/screens/admin/` | An administrator's first sign-in: passkey, code, phone, welcome | 6: Signin, Phone, Code, Welcome, Addpasskey, Passkey |
| `project/accounts/screens/states/` | Whole-screen states that can interrupt any flow | 6: Locked, Suspended, Orgpaused, Expired, Error, Maint |
| `project/accounts/states/` | `FeedbackStates.dc.html`: every inline error, warning and notice state the flows use. `FeedbackCodeMap.dc.html`: which server answer leads to which state and wording | 2 |

## 6 Decisions

| Board | File |
|---|---|
| Decisions, tested | `project/decisions/Decisions.dc.html` |
