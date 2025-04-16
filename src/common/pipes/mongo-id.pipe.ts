import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { IS_TEST } from '../constants';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (IS_TEST) {
      return value;
    }

    if (!isValidObjectId(value)) {
      throw new BadRequestException(`Invalid id format: ${value}`);
    }
    return value;
  }
}
