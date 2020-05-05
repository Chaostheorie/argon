# Argon

argon is a client for [schulerzbistum.de](https://www.schulerzbistum.de) and improves the user experience by simplifying the user interface while maintaining all functionality. This client only maintains pupil accessible functions due to a lack of access of admin functions for development purposes. If you want a version accessing your own webweaver instance take a look at the development notes or [contact me](https://sinclair.gq/pages/contact.html).

## Development notes

The backend logic (data processing etc.) is in the `main.ts` (typescript) while all of the page specific logic (interaction related) (javascript) is in the `src/specific/{name}.js` files.

To get documentation on your available endpoints and services for the jsonrpc API by webweaver visit `https://HOST/wws/559185.php` (e.g. `https://www.schulerzbistum.de/wws/559185.php`).

The interface is for several reasons (mainly the actual userspace) written in German. This will be changed with mutltilang (eng and de) support in `v.0.1.4`.

To change the used instance edit the url (const) in the main.ts to fit your domain (scheme: `https://HOST/jsonrpc.php` e.g. <https://www.schulerzbistum.de/jsonrpc.php>)

### How to setup a development environment

You will need to clone the application with git or download the zip and unpack it.

To get the base dependencies execute `npm install` in the `argon` root folder. You will most likely need a global installation of `tsc` (`npm install -g tsc`) to compile the typescript dependencies and other files. The same may apply (depending on your npm installation) for electron-forge-cli (`npm install -g electron-forge-cli`).

You can execute following scripts (`npm run-script <script>`):

- `start`: `tsc && electron-forge start` For running the application
- `clean`: `rm -rf out dist` cleanup of old compiled files and packages
- `clean-start`: `rm -rf out dist && tsc && electron-forge start` combine `clean` and `start`
- `package`: `electron-forge package` package the application
- `make`: `tsc && electron-forge make` make the application executable (deb ...) may invoke package if not done before
- `publish`: `electron-forge publish` not yet implemented
- `lint`: `eslint --ext .ts .` lint the project and see how I screwed up

For an optimial enviroment I recommend using an IDE like Visual Studio Code or Atom. You will also have a better time with the appropiate extensions (Typescript, npm ...) for your editor.

### How to build a package

At the moment only `.deb` packages are supported and implemented the `package.json`. You should be able to build `.rpm` packages and all supported [makers from electron-forge]() (including MacOSX, that broken thing from Microsoft and other linux distros).

At least `.rpm` will be supported in the future and MacOSX support is planned for `v.0.1.3`.

_Why is Windows not supported?_

There's no reason to not support it besides the missing resources. To actually package/ compile a package for Windows it is _required_ to run the packaging on windows. I won't do that. If you are running a windows system and are willing to package and test it, do it! But don't expect me to support it in the near future (maybe `v.0.1.8`). MacOSX has the same problem _but_ I may be able to get usable access to it _and_ it's linux based.

## Roadmap

### v.0.1.4

- English interface support
- Light and Dark theme
- enhanced accessibility support

### v0.1.3

- support for `.rpm` and `MacOSX`
- stable packages (fully tested)

### v0.1.2

- background process for messages and e-mails with notifications
- improved UX/ UI
- full basic functionality for pupils
- optimizing of typescript with interfaces
- upgrade to newer package versions

### v0.1.1 [Ongoing]

- [X] ~~*login*~~
- [X] ~~*main menu*~~
- [X] ~~*icon (fas fa-dragon)*~~
- [X] ~~*get e-mails and send them*~~
- [ ] manage tasks
- [ ] Stable `.deb` release
- [ ] Universal AppImage Release

## Attributions

I don't own any of the below mentioned libraries. These are regulated under their own respective Licenses. For all libraries installed with npm the same applies.

[Bootstrap toggle](https://gitbrent.github.io/bootstrap4-toggle/) original designed and built by Min Hur for The New York Times Company | Updated by Brent Ely | Available on GitHub | Licensed MIT

[Bootstrap Select](https://developer.snapappointments.com/bootstrap-select/) maintained by SnapAppointments, caseyjhol, and the community.

[Bootstrap 4](https://getbootstrap.com/) 

[Free Material Design Bootstrap](https://mdbootstrap.com/) with it's respective addons.

[Free Fontawesome](https://fontawesome.com/)

[Datatables](https://datatables.net/) designed and created by [SpryMedia Ltd.](https://sprymedia.co.uk/) and addons provided by several sources.

The globally used font is Titillium Web designed by Multiple Designers and available under the [Open Font License](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL).

Menu sidebar design inspired by [Start Bootstrap - Simple Sidebar](https://github.com/BlackrockDigital/startbootstrap-simple-sidebar) from BlackrockDigital.

## WIP

- [ ] Mail Client - 85%
- [ ] notes - 90%
- [ ] address book - 50%
- [ ] file client - 10%
- [ ] test request client - 60%
- [X] ~~*replace axios posts with helper*~~
