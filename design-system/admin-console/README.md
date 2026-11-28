# Admin console design index

The design for Yahel Admin, the app business administrators land in after sign-up. It is its own design file ("Yahel Admin console", version 1), pulled here as a collection of its own beside `../canvas/`, with the file's folders and `project/canvas.json` kept as they are. Every board is web, 1440 wide, drawn light (the plain name) and dark (`Dark`). Tablet and phone are not drawn yet.

Board titles start with `Admin /`, then the section and the screen, so searching for "Admin / 2 Switch on mail" or "User details" finds the board. Each board is a static snapshot of the prototype in `project/flow/Console.dc.html`; the prototype is the source of truth for behaviour.

To add a board: put the file in the folder for its area, add it to `project/canvas.json` with `"page"` set to that area and a title of the form `Admin / Section / Screen / Web, theme`.

## 0 Overview

| Board | File | What it shows |
|---|---|---|
| Overview | `project/Main.dc.html` | Scope of version 1, the decisions taken (setup runs full screen, verify by host connection or record, bought domains set themselves up, list addresses before switching mail, SPF, DKIM and DMARC together with DMARC watch-only) and open questions |

## 1 Clickable prototype (`project/flow/`)

| Board | File | Opens at |
|---|---|---|
| Own domain, light | `Console.dc.html` | Setup, own domain. This file holds all the prototype's markup and logic |
| Own domain, dark | `ConsoleDark.dc.html` | Same, dark |
| Bought domain, light | `ConsoleBought.dc.html` | Setup for a domain bought with Yahel (sets itself up) |
| Console, light | `ConsoleHome.dc.html` | The console home |

Where the logic lives in `Console.dc.html`: styles and the colour variables (lines 12-184), markup (185-361), logic (364-646): host list (371-375), side menu tree with each page's one-line description (376), seed data and the per-board starting states (381-425), navigation `go`/`back` (432-437), DNS checks and the "fail next check" switch (440-464), add a person and its validation (469-480), user changes (481), `renderVals` (491-645).

## 2 Setup flow (`project/setup/`)

Full screen, outside the console, with a three-step rail (Verify domain, Switch on mail, Protect mail) and "Exit setup".

| Section | Boards | What each shows |
|---|---|---|
| 1 Verify your domain | `SetupIntroWeb` | The three steps with times; Get started or Do this later |
| | `SetupHostWeb`, `SetupHostListWeb`, `SetupHostNotFoundWeb` | Domain host detected from DNS; choosing another from a searchable list (worldwide and African hosts, "Another host", "I'm not sure"); host not detected |
| | `SetupMethodWeb` | Connect to the host (hosts marked "Connects automatically") or add a record yourself |
| | `SetupConnectingWeb` | Waiting while the admin approves Yahel at the host |
| | `SetupRecordWeb`, `SetupRecordCnameWeb` | TXT record to copy, or a CNAME instead |
| | `SetupCheckingWeb`, `SetupNotFoundWeb` | Checking; record not found yet with causes, last-checked time, Check again |
| | `SetupVerifiedWeb` | Verified, next step offered |
| 2 Switch on mail | `MailPeopleWeb` | Who gets mail: the people and addresses that must exist before mail switches, seat note |
| | `MailAddPersonWeb`, `MailAddPersonErrorWeb` | Add a person dialog; username taken |
| | `MailRecordsWeb`, `MailCheckingWeb`, `MailReadyWeb` | Two MX records; checking; mail is on |
| 3 Protect your mail | `ProtectRecordsWeb`, `ProtectCheckingWeb`, `ProtectDoneWeb` | SPF, DKIM and DMARC records; checking; all set |
| 4 Domain bought with Yahel | `BoughtAutoWeb` | Every record added automatically, step by step |

## 3 Console (`project/console/`)

The console frame: top bar (menu toggle, "yahel admin" mark, search "Search people, settings and help", Help, theme switch, account menu) and a collapsible side menu (workspace name, Home, Dashboard, Directory, Apps, Security, Data, Billing, Account; footer with Upgrade, Send feedback and legal links).

| Section | Boards | What each shows |
|---|---|---|
| 01 Core views | `HomeWeb`, `HomePartialWeb`, `HomeCompleteWeb` | Home with setup to do, domain verified, setup complete: setup checklist (5 steps), Users, Domain, Billing and Security cards |
| | `UsersWeb` | Users table: name and address, role, status, 2-step, last sign-in; search; status filter chips (All, Active, Invited, Suspended) |
| | `UserDetailsWeb` | One user: Reset password, Make admin, Suspend; account and security facts; Delete user |
| | `HomeAccountMenuWeb` | The account menu open |
| | `HomeMenuCollapsedWeb`, `MenuAllOpenWeb`, `HomeMenuFooterHiddenWeb` | Side menu collapsed, every section open, footer hidden |
| | `PagePlaceholderWeb` | A menu page not designed yet |
| 02 Create and edit | `UsersAddWeb`, `UserDeleteWeb` | Add a person dialog; delete confirmation |
| 04 Search and filters | `UsersNoMatchWeb` | No users match the search |
| 05 Settings | `DomainsWeb` | Primary domain with ownership, mail and protection status |
| | `BillingWeb`, `SecurityWeb`, `AppsWeb` | "Coming in a later version" pages listing what is planned |

Sections 03 (Sharing and people) and 06 (Empty, loading and error states) have no boards in version 1.
