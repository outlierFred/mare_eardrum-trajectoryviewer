# Bundled Markdown libraries

- Marked 18.0.12: https://github.com/markedjs/marked — `marked.umd.js`, MIT license in `marked-LICENSE`.
- DOMPurify 3.4.15: https://github.com/cure53/DOMPurify — `purify.min.js`, license in `DOMPurify-LICENSE`.

Browser distributions are vendored from the corresponding npm packages via jsDelivr. The viewer loads these local files without contacting a CDN. Markdown output is sanitized before insertion into the document.
