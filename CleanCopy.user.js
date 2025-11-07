// ==UserScript==
// @name         CleanCopy
// @namespace    https://github.com/JustOptimize/CleanCopy/
// @version      0.2.0
// @description  Remove tracking parameters when copying URL
// @author       Oggetto
// @match        https://*/*
// @icon         https://github.com/JustOptimize/CleanCopy/blob/main/icon.png?raw=true
// @grant        none
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @downloadURL  https://raw.githubusercontent.com/JustOptimize/CleanCopy/main/CleanCopy.user.js
// @updateURL    https://raw.githubusercontent.com/JustOptimize/CleanCopy/main/CleanCopy.user.js
// ==/UserScript==

const blacklisted_params = [
	"utm_source", // Google Analytics
	"utm_medium",
	"utm_campaign",
	"utm_term",
	"utm_content",
	"utm_referrer",
	"utm_name",
	"utm_id",
	"fbclid", // Facebook
	"gclid", // Google Ads
	"gclsrc",
	"dclid", // Google Display Ads
	"msclkid", // Microsoft Ads
	"yclid", // Yandex Ads
	"ysclid",
	"si", // Youtube shorts
	"sender_device",
	"sender_web_id",
	"share",
	"share_source",
	"is_from_webapp",
];

(() => {
	console.info('CleanCopy: script loaded');
	document.addEventListener("copy", (e) => {
		try {
			e.preventDefault();

			const content = document.getSelection()?.toString();
			console.debug('CleanCopy: copy event, selection="%s"', content);

			if (!content) {
				e.clipboardData.setData("text/plain", "");
				console.debug('CleanCopy: no selection, wrote empty string');
				return;
			}

			try {
				// Only attempt to parse as URL when it's an absolute http/https/ftp URL.
				// This prevents non-URL text (like YAML or multi-line text) from being
				// treated as a relative URL and percent-encoded.
				const isAbsoluteUrl = /^\s*(?:https?:\/\/|ftp:\/\/)\S+/i;
				if (!isAbsoluteUrl.test(content)) {
					e.clipboardData.setData("text/plain", content);
					console.debug('CleanCopy: copy content is not an absolute URL, wrote original');
					return;
				}

				const url = new URL(content);

				blacklisted_params.forEach((param) => {
					url.searchParams.delete(param);
				});

				e.clipboardData.setData("text/plain", url.href);
				console.info('CleanCopy: sanitized copy -> %s', url.href);
			} catch {
				e.clipboardData.setData("text/plain", content);
				console.debug('CleanCopy: copy content is not a URL, wrote original');
				return;
			}
		} catch (outerErr) {
			console.error('CleanCopy: error handling copy event', outerErr);
		}
	});

	const sanitizeText = (text) => {
		if (!text || typeof text !== "string") return text;

		// Only sanitize absolute http/https/ftp URLs. Avoid parsing arbitrary
		// text which could be treated as a relative URL and encoded.
		const isAbsoluteUrl = /^\s*(?:https?:\/\/|ftp:\/\/)\S+/i;
		if (!isAbsoluteUrl.test(text)) return text;

		try {
			const url = new URL(text);
			blacklisted_params.forEach((param) => url.searchParams.delete(param));
			const out = url.href;
			console.debug('CleanCopy: sanitizeText input -> %s', text);
			console.debug('CleanCopy: sanitizeText output -> %s', out);
			return out;
		} catch {
			// Not a URL, return original text
			return text;
		}
	};

	try {
		if (navigator.clipboard) {
			const originalWrite = navigator.clipboard.write?.bind(navigator.clipboard);
			if (originalWrite) {
				navigator.clipboard.write = async (data) => {
					try {
						console.debug('CleanCopy: navigator.clipboard.write called');
						const items = Array.from(data);
						const sanitizedItems = await Promise.all(
							items.map(async (item) => {
								const types = item.types || [];
								const newMap = {};
								for (const type of types) {
									const blob = await item.getType(type);
									if (type === "text/plain") {
										const text = await blob.text();
										const sanitized = sanitizeText(text);
										newMap[type] = new Blob([sanitized], { type });
									} else {
										newMap[type] = blob;
									}
								}
								console.debug('CleanCopy: created sanitized ClipboardItem for types=%o', types);
								return new ClipboardItem(newMap);
							}),
						);
						return originalWrite(sanitizedItems);
					} catch (err) {
						console.error('CleanCopy: error in clipboard.write wrapper, falling back', err);
						return originalWrite(data);
					}
				};
			}

			const originalWriteText = navigator.clipboard.writeText?.bind(navigator.clipboard);
			if (originalWriteText) {
				navigator.clipboard.writeText = async (text) => {
					try {
						console.debug('CleanCopy: navigator.clipboard.writeText called with text="%s"', text);
						const sanitized = sanitizeText(text);
						console.debug('CleanCopy: navigator.clipboard.writeText sanitized to "%s"', sanitized);
						return originalWriteText(sanitized);
					} catch (err) {
						console.error('CleanCopy: error in writeText wrapper, falling back', err);
						return originalWriteText(text);
					}
				};
			}
		}
	} catch {
		console.debug('CleanCopy: clipboard API not accessible, skipping programmatic interception');
	}

	try {
		const sanitizeClipboardCommand = async () => {
			try {
				const input = prompt('Paste text to sanitize (Cancel to abort):');
				if (input === null) {
					console.debug('CleanCopy: user canceled prompt');
					return;
				}
				console.debug('CleanCopy: user input -> %s', input);
				const sanitized = sanitizeText(input);
				if (sanitized === input) {
					console.info('CleanCopy: content unchanged');
					alert('CleanCopy: content unchanged (nothing to sanitize)');
				} else {
					await GM_setClipboard(sanitized);
					console.info('CleanCopy: sanitized content and wrote to clipboard');
					alert('CleanCopy: sanitized content was copied to clipboard');
				}
			} catch (err) {
				console.error('CleanCopy: failed to sanitize/copy via prompt', err);
				alert('CleanCopy: failed to sanitize/copy. See console for details.');
			}
		};

		GM_registerMenuCommand('Clean clipboard (sanitize URLs)', sanitizeClipboardCommand);
	} catch (err) {
		console.debug('CleanCopy: unable to register Tampermonkey menu command', err);
	}
})();
