# Argon

argon is a client for [schulerzbistum.de](https://www.schulerzbistum.de) and improves the user experience by simplifying the user interface while maintaining all functionality. This client only maintains pupil accessible functions due to a lack of access of admin functions for development purposes. If you want a version accessing your own webweaver instance take a look at the development notes or [contact me](https://sinclair.gq/pages/contact.html).

## Development notes

The backend logic (data processing etc.) is in the `main.ts` (typescript) while all of the page specific logic (interaction related) (javascript) is in the `src/specific/{name}.js` files.

To change the used instance edit the url (const) in the main.ts to fit your domain (scheme: `https://HOST/jsonrpc.php` e.g. <https://www.schulerzbistum.de/jsonrpc.php>)

## Roadmap

### v0.1.2

- background process for messages and e-mails (notifications?)
- improved UX/ UI
- improved processing

### v0.1.1 [Ongoing]

- login
- main menu
- get
- icon (fas fa-dragon)
