import { HttpStatus, Injectable } from '@nestjs/common';
import { File } from 'src/api/files/entities/file.entity';
import { CreateFileTask } from 'src/tasks/CreateFileTask';
import { Error as CustomError } from 'src/util/Error';
import { withTransactionalQueryRunner } from 'src/util/withTransactionalQueryRunner';
import { DataSource } from 'typeorm';
import { FileUploadEntity } from './entities/file.upload.entity';

@Injectable()
export class FilesService {
	private dataSource: DataSource;

	constructor(dataSource: DataSource) {
		this.dataSource = dataSource;
	}

	public async upload(fileUploadEntity: FileUploadEntity): Promise<File | CustomError> {
		try {
			return await withTransactionalQueryRunner(this.dataSource, async (runner) => {
				if (await runner.manager.exists(File, { where: { fullPath: fileUploadEntity.fullPath } })) {
					throw new CustomError(`file at ${fileUploadEntity.fullPath} already exists`, HttpStatus.CONFLICT);
				}

				let result = await runner.manager.save(fileUploadEntity.toFile());

				await new CreateFileTask(fileUploadEntity.buffer, fileUploadEntity.fullPath).execute();

				return result;
			});
		} catch (e) {
			if (e instanceof CustomError) {
				return e;
			} else {
				return new CustomError('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}
}