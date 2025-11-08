import type { App, TFolder } from "obsidian";
import type {
	FileExplorerView,
	FileExplorerViewFileItemsRecord,
	FolderTreeItem,
} from "obsidian-typings";

export class ColorGetter {
	app: App;

	constructor(app: App) {
		this.app = app;
	}
	getFileExplorerView(): FileExplorerView | null {
		const navigation = this.app.workspace.getLeavesOfType("file-explorer");
		if (navigation.length === 0) return null;
		return navigation[0].view as FileExplorerView;
	}
	getFolderAtRoot() {
		return this.app.vault
			.getAllFolders()
			.filter(
				(folder: TFolder) => folder.parent && folder.parent === this.app.vault.getRoot()
			);
	}

	async injectDataPathFromFolder(folder: TFolder, folderItem?: FolderTreeItem) {
		if (!folderItem) folderItem = this.getFileItems(folder);
		if (!folderItem) {
			console.warn(`Folder item not found for folder: ${folder.path}`);
			return;
		}
		folderItem.el.setAttribute("data-path", folder.path);
	}

	getFileItems(folder: TFolder, fileItems?: FileExplorerViewFileItemsRecord) {
		if (!fileItems) {
			const fileExplorer = this.getFileExplorerView();
			if (!fileExplorer) return undefined;
			fileItems = fileExplorer.fileItems;
		}
		const folderItem = fileItems[folder.path];
		// It is impossible that the folderItem is a FileTreeItem as we are looking for a folder
		if (!folderItem) return undefined;
		return folderItem as FolderTreeItem;
	}
}
