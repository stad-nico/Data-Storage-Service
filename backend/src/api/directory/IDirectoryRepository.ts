import { EntityManager } from '@mikro-orm/mariadb';

import { Directory } from 'src/db/entities/Directory';
import { File } from 'src/db/entities/File';

export type DirectoryGetMetadataDBResult = Omit<Directory, 'parent' | 'isRecycled'> & {
	size: number;
	files: number;
	directories: number;
};

export type DirectoryGetContentDBResult = {
	files: Array<Pick<File, 'name' | 'mimeType' | 'size' | 'createdAt' | 'updatedAt'>>;
	directories: Array<Pick<Directory, 'name' | 'createdAt' | 'updatedAt'> & { size: number }>;
};

export const IDirectoryRepository = Symbol('IDirectoryRepository');

/**
 * Interface for executing directory operations on the db.
 * @interface
 */
export interface IDirectoryRepository {
	/**
	 * Selects name and id of the first non recycled directory with the given path.
	 * Returns null if no directory was found.
	 * @async
	 *
	 * @param   {EntityManager} entityManager                    the entityManager
	 * @param   {string}        path                             the path of the directory
	 * @returns {Promise<Pick<Directory, 'id' | 'name'> | null>} the name and id of the directory
	 */
	selectByPath(entityManager: EntityManager, path: string): Promise<Pick<Directory, 'id' | 'name'> | null>;

	/**
	 * Selects isRecycled and path of a directory.
	 * Returns null if no directory was found.
	 * @async
	 *
	 * @param   {EntityManager} entityManager                                  the entityManager
	 * @param   {string}        id                                             the id of the directory
	 * @param   {boolean}       isRecycled                                     whether the directory to find should be a recycled one
	 * @returns {Promise<{ path: string, isRecycled: boolean } | null>}        the path and recycled status of the directory
	 */
	selectById(entityManager: EntityManager, uuid: string, isRecycled: boolean): Promise<{ path: string; isRecycled: boolean } | null>;

	/**
	 * Checks if a non recycled directory at the given path exists.
	 * @async
	 *
	 * @param   {EntityManager}    entityManager the entityManager
	 * @param   {string}           path          the path of the directory
	 * @returns {Promise<boolean>}               whether a directory at the path exists
	 */
	exists(entityManager: EntityManager, path: string): Promise<boolean>;

	/**
	 * Inserts a new directory into the db.
	 * @async
	 *
	 * @param   {EntityManager} entityManager the entityManager
	 * @param   {string}        name          the name of the directory
	 * @param   {string|null}   parent        the parent of the directory
	 */
	insert(entityManager: EntityManager, name: string, parent: string | null): Promise<void>;

	/**
	 * Soft deletes a directory tree by the root id
	 * by setting isRecycled to true for all directories and files in that subtree.
	 * @async
	 *
	 * @param {EntityManager} entityManager the entityManager
	 * @param {string}        rootUuid      the id of the tree root
	 */
	softDelete(entityManager: EntityManager, rootUuid: string): Promise<void>;

	/**
	 * Selects the metadata of a non recycled directory by its path.
	 * @async
	 *
	 * @param   {EntityManager}                                entityManager the entityManager
	 * @param   {string}                                       path          the path of the directory
	 * @returns {Promise<DirectoryGetMetadataDBResult | null>}               the metadata
	 */
	getMetadata(entityManager: EntityManager, path: string): Promise<DirectoryGetMetadataDBResult | null>;

	/**
	 * Selects the first level non deleted subdirectories and files of a non deleted directory by its path.
	 * @async
	 *
	 * @param   {EntityManager}                               entityManager the entityManager
	 * @param   {string}                                      path          the path of the directory
	 * @returns {Promise<DirectoryGetContentDBResult | null>}               the result
	 */
	getContent(entityManager: EntityManager, path: string): Promise<DirectoryGetContentDBResult>;

	/**
	 * Selects the path and id of all non deleted files inside a non deleted directory by the path of the root directory.
	 * All file paths are relative to the path of the root directory.
	 * @async
	 *
	 * @param   {EntityManager} entityManager the entityManager
	 * @param   {string}        path          the path of the root directory
	 * @returns {Promise<Array<Pick<File, 'uuid'> & { path: string }>>} the files
	 */
	getFilesRelative(entityManager: EntityManager, path: string): Promise<Array<Pick<File, 'id'> & { path: string }>>;

	/**
	 * Updates a directory.
	 * @async
	 *
	 * @param {EntityManager}                               entityManager the entityManager
	 * @param {string}                                      path          the path of the directory to update
	 * @param {{ name?: string; parentId?: string | null }} partial       the partial directory to update
	 */
	update(entityManager: EntityManager, path: string, partial: { name?: string; parentId?: string | null }): Promise<void>;

	/**
	 * Restores a directory tree by the root id
	 * by setting isRecycled to false for all directories and files in that subtree.
	 * @async
	 *
	 * @param {EntityManager} entityManager the entityManager
	 * @param {string}        rootId        the id of tree root
	 */
	restore(entityManager: EntityManager, rootId: string): Promise<void>;
}
