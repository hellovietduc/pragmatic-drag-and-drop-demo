# Pragmatic Drag and drop demo

This project was created as a POC to adopt [Pragmatic Drag and drop](https://github.com/atlassian/pragmatic-drag-and-drop) at [Padlet](https://padlet.com).

It presents the challenges we have to deal with when building a drag and drop experience for large lists of items on a web page:

- Items have rich content, most of the time there's an image in each item.
- Item height is dynamic as the content is written by the user.
- When the drag is started, we want to collapse all the items to make it easier to drag on a big page.
- Because of this, the items have a separate collapsed UI and custom drag preview.
- Items are grouped in sections, and each section can also be dragged and dropped.

Other than that, this project also showcased the potential when using Pragmatic Drag and drop:

- It can easily be tested with Playwright.
- It supports virtualized lists for rendering.
- It's very easy to build drag and drop between 2 windows/tabs or even to an external application.

Visit the live version [here](https://pragmatic-drag-and-drop-demo.duckwho.codes).
