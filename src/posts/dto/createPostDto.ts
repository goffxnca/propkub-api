import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  // @IsNotEmpty()
  // @IsEmail()
  // email: string;

  // @IsNotEmpty()
  // @IsString()
  // @MinLength(6)
  // password: string;
}
