import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { PathUtils } from 'src/util/PathUtils';

/**
 * Class representing the http request url params.
 * @class
 */
export class DirectoryRenameParams {
	/**
	 * The path of the directory to rename.
	 * @type {string}
	 */
	@IsNotEmpty()
	@IsString()
	@Matches(PathUtils.ValidDirectoryPathRegExp, { message: 'path must be a valid directory path' })
	readonly path: string;

	/**
	 * Creates a new DirectoryRenameParams instance.
	 * @private @constructor
	 *
	 * @param   {string}                path the path of the directory
	 * @returns {DirectoryRenameParams}      the DirectoryRenameParams instance
	 */
	private constructor(path: string) {
		this.path = path;
	}
}
