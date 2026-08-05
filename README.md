# Headra

Cross-browser request and response header modification extension/add-on.

<img src="./public/screenshot.png" width="600" />

## Marketplaces

- **Chrome**: _Not yet available_
- **Firefox**: _Not yet available_
- **Safari**: _Not yet available_
- **Edge**: _Not yet available_
- **Opera**: _Not yet available_

## Building from Source

- `npm i`
- `npm run build` (for Chrome, Safari, Edge, Opera)
- `npm run zip:firefox` (for Firefox)

## Loading Built Extension

You'll need to follow the instructions in **Building from Source** first.

> [!NOTE]
> While this extension/add-on _should_ work for any operating system, these instructions are for MacOS. The instructions _should_ be pretty much the same for other operating systems, but getting to the settings pages might be slightly different.

### Chrome, Edge, Opera

- Navigate to `about://extensions` in the address bar.
- Turn on **Developer Mode**.
- Click on **Load Unpacked**
- Find the **build > chrome-mv3** folder in the project, and click **Select**.

### Firefox

> [!IMPORTANT]
> Firefox requires signed Add-ons, but this requirement can be disabled in the [Firefox Developer Edition](https://www.firefox.com/en-US/channel/desktop/developer/). That's what the following instructions are for.

-
- Navigate to `about:addons` in the address bar.
- Click the ⚙ button to **Install Add-on From File...**
- Find the **build > headra-_\<version\>_-firefox.zip** file in the project, and click **Open**.

### Safari (temporary install)

> [!IMPORTANT]
> As much as I can tell, Safari has a lot of hoops to jump through to get a _permanently_-installed extension. The instructions provided will only allow a _temporarily_-installed extension... which gets removed whenever the browser is closed, and has limited feature support. It's best to find the extension in the App Store when/if one becomes available.

- Click the top-left browser name menu, and go to **Settings**.
- Go to the **Advanced** tab, and check **Show features for web developers**.
- Go to the **Developer** tab, and **Add Temporary Extension...**
- Find the **build > chrome-mv3** folder in the project, and click **Select**.
