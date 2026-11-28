# Admin console design index

The design for Yahel Admin, the app business administrators land in after sign-up. It is its own design file ("Yahel Admin console", version 1), pulled here as a collection of its own beside `../canvas/`, with the file's folders and `project/canvas.json` kept as they are. Every screen is drawn three times: web 1440 wide (`…Web`), tablet 768 wide (`…Tablet`) and phone 390 wide (`…Mobile`), each light (the plain name) and dark (`…Dark`). The menu-state boards (`HomeMenuCollapsed`, `HomeMenuFooterHidden`, `MenuAllOpen`) are web only; the menu drawer (`HomeMenuDrawer`) and the units sheet (`UsersUnitsOpen`) are tablet and phone only.

Board titles start with `Admin /`, then the section and the screen, so searching for "Admin / 2 Switch on mail" or "User details" finds the board. Each board is a static snapshot of the prototype in `project/flow/Console.dc.html`; the prototype is the source of truth for behaviour.

To add a board: put the file in the folder for its area, add it to `project/canvas.json` with `"page"` set to that area and a title of the form `Admin / Section / Screen / Web, theme`.

Canvas pages: 0 Overview, 1 Clickable prototype, 2 Setup flow, 3 Console, 4 Setup flow · phone, 5 Console · phone, 6 Setup flow · tablet, 7 Console · tablet. Rows on the phone and tablet pages match the desktop pages.

Below 900 px the side menu is a drawer that slides over the page (its own header with the mark and "Close menu"); below 560 px dialogs open as bottom sheets and action buttons go full width. On tablets the Users table drops the 2-step column; on phones lists become stacked rows and the units panel opens as a sheet.

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
| Phone | `ConsolePhone.dc.html` | Setup, own domain, at 390 wide |

Where the logic lives in `Console.dc.html` (1088 lines): styles and colour variables, including the drawer, bottom-sheet, checkbox, segmented control, unit tree, chip and bulk-bar rules (lines 12-290), markup (291-547), logic (549-1087): host list (557-561), side menu tree with each page's one-line description and its routes (562-565), seed users (567-576), unit tree (577-578), groups, admin roles, password check and generator (581-584), add-people rows and custom-field types (585-587), seed data and the per-board starting states (590-654), navigation `go`/`back` (661-666), DNS checks and the "fail next check" switch (669-693), add a person in setup (698-709), user changes (710), add-people rows and submit (721-744), custom fields (745-753), edit details and aliases (754-767), `renderVals` (768-1086).

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
| | `MailRecordsWeb`, `MailCheckingWeb`, `MailReadyWeb` | Two MX records; checking (labelled "Mail setup"); mail is on |
| 3 Protect your mail | `ProtectRecordsWeb`, `ProtectCheckingWeb`, `ProtectDoneWeb` | SPF, DKIM and DMARC records; checking (labelled "Mail protection"); all set |
| 4 Domain bought with Yahel | `BoughtAutoWeb` | Every record added automatically, step by step |

## 3 Console (`project/console/`)

The console frame: top bar (menu toggle, "yahel admin" mark, search "Search people, settings and help", Help, theme switch, account menu) and a collapsible side menu (workspace name, Home, Dashboard, Directory, Apps, Security, Data, Billing, Account; footer with Upgrade, Send feedback and legal links). Below 900 px the menu is a drawer with its own header and "Close menu".

| Section | Boards | What each shows |
|---|---|---|
| 01 Core views | `HomeWeb`, `HomePartialWeb`, `HomeCompleteWeb` | Home with setup to do, domain verified, setup complete: setup checklist (5 steps), Users, Domain, Billing and Security cards |
| | `UsersWeb` | Users: header with Download, More and Add people; a Units panel (tree with counts, "One unit" or "Several", Manage units); "Everyone in …" scope line; search; status segmented filter with counts (All, Active, Invited, Suspended); table with a select-all checkbox, name and address, unit, role, status, 2-step, last sign-in; footer count |
| | `UserDetailsWeb` | One user: header (name with edit, address with copy, status, role, unit chip that changes unit, last sign-in and added); quick actions (Reset password, Send email, Sign out everywhere, Suspend); cards for Addresses (Manage), Groups (Manage), Admin role (Change), Storage, Profile (Edit), Security, Deleted data (Restore); "Remove … from …" with Remove user |
| | `UserInvitedWeb`, `UserSuspendedWeb` | The same page for someone invited (banner "hasn't signed in yet", Resend sign-in details) and someone suspended (banner, Restore access; Restore replaces Suspend) |
| | `HomeAccountMenuWeb` | The account menu open |
| | `HomeMenuCollapsedWeb`, `MenuAllOpenWeb`, `HomeMenuFooterHiddenWeb` | Side menu collapsed, every section open, footer hidden |
| | `HomeMenuDrawerTablet`, `HomeMenuDrawerMobile` | The menu open as a drawer |
| | `PagePlaceholderWeb` | A menu page not designed yet |
| 02 Create and edit | `UsersAddWeb`, `AddPeopleFilledWeb`, `AddPeopleErrorsWeb`, `AddPeopleDoneWeb` | Add people page: rows of first name, last name, new address (username and a verified-domain picker), "Send sign-in details to"; a new row appears as you type; "Put them in" unit; count and "Add 3 people"; errors per row (bad email, missing first name, address taken with a suggestion); done list with where each sign-in went, Back to Users, Add more people |
| | `UserDeleteWeb`, `UserRemoveHandoverWeb` | Remove dialog: Suspend instead, or Delete their account; then hand over work (new owner, Drive files, calendar, copy of mail, the "I understand" box, Delete …'s account) |
| | `UserEditWeb` | Side panel: first and last name, address (old one kept as an alias), phone, job title, department, personal email |
| | `UserAliasesWeb` | Side panel: add an alias on a verified domain, list with remove, "Up to 30" |
| | `UserGroupsWeb` | Side panel: search groups, tick the ones they belong to, "Save 4 groups" |
| | `UserUnitWeb` | Side panel: the unit tree with "Now", what changes, "Move to Design team" |
| | `UserRoleWeb` | Side panel: No admin role, Help desk, User admin, Groups admin, Super admin |
| | `ResetPasswordWeb`, `ResetPasswordOwnWeb`, `ResetPasswordDoneWeb` | Reset password dialog: generate or set it, strength, "Ask them to change it", "Sign them out of every device"; the generated password with Copy and "Email it to them" |
| | `UserSuspendWeb` | Suspend dialog listing what happens (signed out, mail held, everything kept, still a paid seat) |
| | `RestoreDataWeb` | Restore deleted data: Mail and Files, a date range (last day, week, 25 days, dates) |
| 04 Search and filters | `UsersNoMatchWeb` | No one matches the search, Show everyone |
| | `UsersUnitWeb`, `UsersMultiWeb` | One unit picked ("People in Lagos office and its units" chip); several units picked (chips per unit) |
| | `UsersSelectedWeb`, `UsersMoveWeb` | People selected: bulk bar (Move to unit, Reset passwords, Suspend, Delete, Clear selection); the Move to unit menu |
| | `UsersMoreWeb` | The More menu: Custom profile fields, Let people edit their profile, Bring in personal accounts, Recently deleted |
| | `UsersUnitsOpenTablet`, `UsersUnitsOpenMobile` | The units panel open as a sheet |
| 05 Settings | `DomainsWeb` | Primary domain with ownership, mail and protection status |
| | `BillingWeb`, `SecurityWeb`, `AppsWeb` | "Coming in a later version" pages listing what is planned |
| | `UsersDownloadWeb` | Download people dialog: who (everyone shown, or the selection), which details (on screen, or every profile field), format (Yahel Sheets, CSV, JSON) |
| | `CustomFieldsWeb`, `CustomFieldAddWeb` | Custom profile fields page (your groups of fields, built-in Contact, Other addresses and Work); add fields dialog with rows of name, type, who can see it, one or several values |
| | `ProfileEditingWeb` | Let people edit their profile: switches for name, photo, phone numbers, address, job title and department |
| | `RecentlyDeletedWeb` | Recently deleted accounts with days left and Restore |

Sections 03 (Sharing and people) and 06 (Empty, loading and error states) have no boards in version 1.
