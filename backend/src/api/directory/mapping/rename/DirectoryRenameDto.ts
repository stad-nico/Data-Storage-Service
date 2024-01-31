import { DirectoryRenameBody } from 'src/api/directory/mapping/rename/DirectoryRenameBody';
import { DirectoryRenameParams } from 'src/api/directory/mapping/rename/DirectoryRenameParams';
import { PathUtils } from 'src/util/PathUtils';
import { ValidationError } from 'src/util/ValidationError';

/**
 * DTO for bundling the http request data.
 * @class
 */
export class DirectoryRenameDto {
	/**
	 * The path of the directory to rename.
	 * @type {string}
	 */
	readonly sourcePath: string;

	/**
	 * The path to rename the directory to.
	 * @type {string}
	 */
	readonly destPath: string;

	/**
	 * Creates a new DirectoryRenameDto instance.
	 * @private @constructor
	 *
	 * @param   {string}             sourcePath the path of the directory to rename
	 * @param   {string}             destPath   the path to rename the directory to
	 * @returns {DirectoryRenameDto}            the DirectoryRenameDto instance
	 */
	private constructor(sourcePath: string, destPath: string) {
		this.sourcePath = sourcePath;
		this.destPath = destPath;
	}

	/**
	 * Creates a new DirectoryRenameDto instance from the http params.
	 * Throws if the given params are not valid.
	 * @public @static
	 *
	 * @throws  {ValidationError} sourcePath must be a valid directory path
	 * @throws  {ValidationError} destPath must be a valid directory path
	 *
	 * @param   {DirectoryRenameParams} directoryRenameParams the http params
	 * @param   {DirectoryRenameBody}   directoryRenameBody   the http request body
	 * @returns {DirectoryRenameDto}                          the DirectoryRenameDto instance
	 */
	public static from(directoryRenameParams: DirectoryRenameParams, directoryRenameBody: DirectoryRenameBody): DirectoryRenameDto {
		const sourcePath = PathUtils.normalizeDirectoryPath(directoryRenameParams.path);

		if (!PathUtils.isValidDirectoryPath(sourcePath)) {
			throw new ValidationError(`path ${sourcePath} is not a valid directory path`);
		}

		const destPath = PathUtils.normalizeDirectoryPath(directoryRenameBody.newPath);

		if (!PathUtils.isValidDirectoryPath(destPath)) {
			throw new ValidationError(`path ${destPath} is not a valid directory path`);
		}

		return new DirectoryRenameDto(directoryRenameParams.path, directoryRenameBody.newPath);
	}
}
