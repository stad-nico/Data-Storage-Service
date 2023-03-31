import { LayoutMap, Layout } from "src/client/common/ui/Layout.js";
import { DOMComponent } from "src/client/common/ui/components/DOM.js";
import { toKebabCase } from "../string.js";
import { Theme } from "../ui/Theme.js";
import { EventEmitter } from "../EventEmitter.js";

export class UserInterfaceService {
	/**
	 * Layout
	 */
	private _layout: Layout;

	/**
	 * Theme
	 */
	private _theme: Theme;

	/**
	 * DOMComponent that handles UI Component creation
	 */
	private readonly _domComponent: DOMComponent;

	/**
	 * Creates a new UserInterfaceService instance
	 *
	 * @param layout The layout
	 */
	constructor(layout: Layout, theme: Theme) {
		this._layout = layout;
		this._theme = theme;

		this._domComponent = new DOMComponent(document.body);
		this._buildLayout();
		this._domComponent.setAttribute("data-layout", toKebabCase(Layout[layout]));
		this._domComponent.setAttribute("data-theme", toKebabCase(this._theme));
	}

	/**
	 * Parses the layout from this._layout and builds it
	 */
	private _buildLayout(): void {
		let config = LayoutMap[this._layout];

		let eventEmitter = new EventEmitter();

		for (let componentConfig of config) {
			new componentConfig.component(this._domComponent, eventEmitter);
		}

		this._domComponent.build();
	}

	/**
	 * Update the layout
	 *
	 * @param layout The new layout
	 */
	public update(layout: Layout): void {
		this._layout = layout;
		this._buildLayout();
	}

	/**
	 * Get the current layout
	 */
	public getLayout(): Layout {
		return this._layout;
	}
}
