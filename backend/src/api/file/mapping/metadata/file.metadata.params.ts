import { Matches } from 'class-validator';

export class FileMetadataParams {
	@Matches(/^(([^<>.|\/\\:"?]|\.(?!\.))+\/)*([^<>|.\/\\:"?]+(\.[^<>|.\/\\:"?]+)+)$/im, {
		message: '$property must be a valid file path',
	})
	readonly path: string;

	constructor(path: string) {
		this.path = path;
	}
}