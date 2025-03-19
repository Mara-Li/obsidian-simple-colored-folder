# Border color

![tree with colored folders](./border_snippets.png)

Add this if in the template CSS part to apply the color to the folder collapse icon and the border bottom of the folder.

```css
.tree-item-self.nav-folder-title[data-path^="${folderName}"] .collapse-icon svg.svg-icon {
  --nav-collapse-icon-color: var(${color});
}

.nav-files-container.node-insert-event>div>.tree-item.nav-folder>.tree-item-self.nav-folder-title[data-path="${folderName}"] {
  border-bottom: 1px solid var(${color});
  border-radius: 0;
}
```

To remove the border when collapsed, add just this in a separate CSS snippet:

```css
.nav-files-container.node-insert-event>div>.tree-item.nav-folder.is-collapsed>.tree-item-self.nav-folder-title {
  border-bottom: 0;
}
```