import { CreatePostDto } from './createPostDto';
import { PartialType } from '@nestjs/swagger';

export class UpdatePostDto extends PartialType(CreatePostDto, {
  skipNullProperties: false,
}) {}
